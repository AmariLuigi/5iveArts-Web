import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { processCompletedCheckout } from "@/lib/orders";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

/**
 * Manually trigger order processing and email confirmation.
 * This is useful if a webhook failed or for re-sending emails from the success page.
 */
export async function POST(req: NextRequest) {
    const ip = getClientIp(req);

    // ── Rate Limiting ───────────────────────────────────────────────
    // 5 attempts per IP per 15 minutes to prevent session enumeration
    const limit = checkRateLimit(`resend-${ip}`, {
        limit: 5,
        windowMs: 15 * 60 * 1000
    });

    if (!limit.success) {
        return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 }
        );
    }

    try {
        const { sessionId } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ error: "Invalid session" }, { status: 400 });
        }

        // 1. Retrieve session from Stripe
        let session;
        try {
            session = await getStripe().checkout.sessions.retrieve(sessionId);
        } catch (e) {
            // Use uniform error for all invalid session checks to prevent enumeration
            return NextResponse.json({ error: "Invalid session" }, { status: 400 });
        }

        // 2. Security Check: Only process if payment is confirmed
        if (session.payment_status !== "paid" || session.status !== "complete") {
            return NextResponse.json(
                { error: "Invalid session" },
                { status: 400 }
            );
        }

        // 3. Process the checkout (idempotent)
        const result = await processCompletedCheckout(session);

        return NextResponse.json({
            success: true,
            orderId: result.orderId,
            alreadyProcessed: result.alreadyProcessed
        });
    } catch (err: any) {
        console.error("[api/checkout/resend] Error:", err.message);
        // Sanitize error message to prevent leaking internal details
        return NextResponse.json(
            { error: "Manual confirmation failed" },
            { status: 500 }
        );
    }
}
