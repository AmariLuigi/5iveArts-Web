import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { fetchPacklinkRates } from "@/lib/packlink";
import { getSiteSettings } from "@/lib/settings";
import { ShippingAddress } from "@/types";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, scale, finish, imageUrls } = await req.json();

    if (!title || !description || !imageUrls || !imageUrls.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
            shippingOptions = await fetchPacklinkRates(shippingAddress as ShippingAddress, 10000, settings.logistics); // Use 100.00 EUR as benchmark for initial estimation
        } catch (err) {
            console.error("[POST /api/orders/custom] Packlink fetch failed:", err);
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

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/orders/custom] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
