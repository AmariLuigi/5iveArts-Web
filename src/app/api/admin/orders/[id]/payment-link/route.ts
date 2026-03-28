import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { type } = await req.json(); // 'deposit' or 'final'
    
    if (!type || !['deposit', 'final'].includes(type)) {
      return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin() as any;
    
    // 1. Fetch Order Data
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.is_custom) {
      return NextResponse.json({ error: "Payment links are only for custom orders" }, { status: 400 });
    }

    const totalPence = order.total_pence;
    if (totalPence <= 0) {
      return NextResponse.json({ error: "Order price must be set before generating a payment link" }, { status: 400 });
    }

    // 2. Calculate Amount
    let amount = 0;
    let description = "";

    if (type === 'deposit') {
      amount = Math.round(totalPence * 0.5);
      description = `Artisan Bureau: Custom Prototype Deposit (50%) - Order #${orderId.slice(0, 8).toUpperCase()}`;
    } else {
      // Final payment includes the remaining 50% + shipping
      const depositPaid = order.deposit_pence || 0;
      amount = totalPence - depositPaid + (order.shipping_pence || 0);
      description = `Artisan Bureau: Project Final Completion & Logistics - Order #${orderId.slice(0, 8).toUpperCase()}`;
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "Payment amount must be greater than zero" }, { status: 400 });
    }

    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.5ivearts.com";
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    // 3. Create Stripe Session
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: amount,
            product_data: {
              name: `5iveArts Commission: ${description}`,
              images: ["https://5ivearts.com/logo.svg"], // Placeholder or first progress image?
            },
          },
          quantity: 1,
        },
      ],
      customer_email: order.customer_email,
      metadata: {
        order_id: orderId,
        payment_type: type,
        is_custom: "true",
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/account`,
    });

    // 4. Update status to 'quoted' if we just sent the first link
    if (order.status === "analyzing" && type === "deposit") {
        await supabase
            .from("orders")
            .update({ status: "quoted" })
            .eq("id", orderId);
    }

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[POST /api/admin/orders/payment-link] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
