import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { fetchShippingRates } from "@/lib/paccofacile";
import { getSiteSettings } from "@/lib/settings";
import { ShippingAddress } from "@/types";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { sanitizeNumber, escapeHtml } from "@/lib/validate";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  // ── Rate Limiting (5 proposals per IP per minute) ──────────────────────────
  const ip = getClientIp(req);
  const rl = checkRateLimit(`custom-order:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // ── Input Validation & Sanitization ────────────────────────────────────
    const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : null;
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 3000) : null;
    const scale = typeof body.scale === "string" ? body.scale.trim().slice(0, 20) : null;
    const finish = typeof body.finish === "string" ? body.finish.trim().slice(0, 50) : null;
    const rawUrls = body.imageUrls;

    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!description) return NextResponse.json({ error: "Description is required" }, { status: 400 });
    if (!rawUrls || !Array.isArray(rawUrls) || rawUrls.length === 0) {
      return NextResponse.json({ error: "At least one reference image is required" }, { status: 400 });
    }
    if (rawUrls.length > 3) {
      return NextResponse.json({ error: "Maximum 3 reference images allowed" }, { status: 400 });
    }

    // Validate all image URLs are from our own Supabase storage (prevent SSRF)
    const supabaseStorageHost = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace("https://", "") || "";
    const imageUrls: string[] = rawUrls.filter(
      (url: unknown) =>
        typeof url === "string" &&
        url.startsWith("https://") &&
        (supabaseStorageHost ? url.includes(supabaseStorageHost) : true)
    );
    if (imageUrls.length !== rawUrls.length) {
      return NextResponse.json({ error: "Invalid image URLs" }, { status: 400 });
    }

    // 0. Fetch User Default Address if available
    const { data: defaultAddress } = await (supabase.from("user_addresses") as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .single();

    const shippingAddress = defaultAddress ? {
      full_name: defaultAddress.full_name,
      street1: defaultAddress.street1,
      street2: defaultAddress.street2,
      city: defaultAddress.city,
      zip_code: defaultAddress.zip_code,
      country: defaultAddress.country,
      phone: defaultAddress.phone,
      email: user.email
    } : null;

    // 0.5 Fetch Shipping Rates if address exists
    let shippingOptions: any[] = [];
    if (shippingAddress) {
      try {
        const settings = await getSiteSettings();
        shippingOptions = await fetchShippingRates(shippingAddress as ShippingAddress, 10000, settings.logistics); // Use 100.00 EUR as benchmark for initial estimation
      } catch (err) {
        console.error("[POST /api/orders/custom] Paccofacile fetch failed:", err);
      }
    }

    // 1. Create the Custom Order
    const { data: order, error: orderError } = await (supabase as any)
      .from("orders")
      .insert({
        user_id: user.id,
        customer_email: user.email,
        customer_name: user.user_metadata?.full_name || "Agent",
        shipping_address: shippingAddress,
        shipping_options: shippingOptions,
        status: "analyzing",
        is_custom: true,
        scale: scale,
        total_pence: 1, // Minimum 1 pence placeholder for proposal state
        subtotal_pence: 1,
        shipping_pence: 0,
        stripe_session_id: null, // Successfully unblocked by migration 008 (DROP NOT NULL)
        // Using metadata to store custom project details if needed
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create the Order Item for this commission
    const { error: itemError } = await (supabase as any)
      .from("order_items")
      .insert({
        order_id: (order as any).id,
        product_name: `Custom Commission: ${title}`,
        quantity: 1,
        product_price_pence: 1, // Using 1 pence as placeholder to satisfy DB check constraints until quoted
        product_id: "CUSTOM-PROTO", // Requires matching 'CUSTOM-PROTO' entry in products table
        // We'll store description in metadata or just it's fine for now
      });

    if (itemError) throw itemError;

    // 3. Create the initial progress records (Reference assets)
    const progressRecords = imageUrls.map((url: string) => ({
      order_id: (order as any).id,
      url: url,
      stage: "Reference",
    }));

    const { error: mediaError } = await (supabase as any)
      .from("order_progress_media")
      .insert(progressRecords);

    if (mediaError) throw mediaError;

    // ── Email Notifications ─────────────────────────────────────────────────
    const customerName = user.user_metadata?.full_name || "Collector";
    const shortId = (order as any).id?.slice(0, 8)?.toUpperCase() || "NEW";

    // 1. User confirmation email
    sendOrderConfirmationEmail({
      to: user.email!,
      orderId: shortId,
      customerName,
      total: "Pending Quote",
      items: [{ name: `Custom Commission: ${escapeHtml(title)}`, quantity: 1 }],
    }).catch((err) => console.error("[custom-order] User email error:", err));

    // 2. Admin notification email
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.RESEND_FROM_EMAIL;
    if (adminEmail) {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
      const fromName = process.env.RESEND_FROM_NAME || "5iveArts";
      resend.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: adminEmail,
        subject: `[5iveArts] New Commission: ${escapeHtml(title)} — ${shortId}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:40px;background:#050505;color:#fff;border:1px solid #111;">
            <h1 style="color:#eab308;font-size:20px;text-transform:uppercase;letter-spacing:0.2em;">New Commission Request</h1>
            <p style="color:#a3a3a3;font-size:12px;">From: <strong style="color:#fff">${escapeHtml(customerName)}</strong> (${escapeHtml(user.email || "")})</p>
            <div style="background:#0c0c0c;border:1px solid #1a1a1a;padding:20px;margin:20px 0;">
              <p style="margin:0 0 8px;font-size:11px;color:#eab308;text-transform:uppercase;">Project: <span style="color:#fff">${escapeHtml(title)}</span></p>
              <p style="margin:0 0 8px;font-size:11px;color:#737373;text-transform:uppercase;">Scale: ${escapeHtml(scale || "N/A")} | Finish: ${escapeHtml(finish || "N/A")}</p>
              <p style="margin:0;font-size:11px;color:#737373;">${escapeHtml(description.slice(0, 500))}</p>
            </div>
            <p style="font-size:11px;color:#737373;">Reference images: ${imageUrls.length} uploaded</p>
            <a href="https://5ivearts.com/admin/orders/${(order as any).id}" style="display:inline-block;padding:12px 24px;background:#eab308;color:#000;text-decoration:none;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em;margin-top:20px;">View in Admin Panel</a>
          </div>
        `,
      }).catch((err: any) => console.error("[custom-order] Admin email error:", err));
    }

    return NextResponse.json({ success: true, orderId: (order as any).id }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/orders/custom] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
