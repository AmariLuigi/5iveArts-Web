import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase-server";

/**
 * Creates a Stripe Billing Portal session for the current user.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lang } = await req.json();
    const stripe = getStripe();

    // ── Customer Lookup Strategy ───────────────────────────────────────────
    // We try to find the customer by email in Stripe. 
    // In production, we'd ideally have 'stripe_customer_id' in the user's profile.
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ 
        error: "No active commercial profile found in Stripe. Please complete an acquisition first." 
      }, { status: 404 });
    }

    const customerId = customers.data[0].id;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.5ivearts.com";
    const returnUrl = `${baseUrl}/${lang}/account`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[billing-portal] Error:", err);
    return NextResponse.json({ error: "Portal unavailable" }, { status: 500 });
  }
}
