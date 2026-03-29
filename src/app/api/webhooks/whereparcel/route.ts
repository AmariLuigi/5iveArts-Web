import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import crypto from 'crypto';

/**
 * WhereParcel Webhook Handler
 * Receives real-time tracking updates and updates the orders table.
 */
export async function POST(req: NextRequest) {
    try {
        const payloadText = await req.text();
        const payload = JSON.parse(payloadText);
        const signature = req.headers.get("x-whereparcel-signature");
        const secret = process.env.WHEREPARCEL_WEBHOOK_SECRET;

        console.log("[webhook/whereparcel] Received update:", JSON.stringify(payload, null, 2));

        // 1. Signature Verification (Security Layer)
        if (secret && signature) {
            const hmac = crypto.createHmac('sha256', secret);
            const digest = hmac.update(payloadText).digest('hex');
            
            if (digest !== signature) {
                console.warn("[webhook/whereparcel] Signature mismatch. Possible unauthorized request.");
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        // 2. Data Extraction
        const event = payload.event;
        const data = payload.payload;

        if (!data || !data.trackingNumber) {
            return NextResponse.json({ error: "Missing tracking data" }, { status: 400 });
        }

        const trackingNumber = data.trackingNumber;
        const currentStatus = data.currentStatus; // e.g., 'delivered', 'in_transit'
        
        // Use clientId for direct order mapping if available
        const orderId = payload.clientId || data.clientId;

        const supabase = getSupabaseAdmin() as any;

        // 3. Find Order Target
        let query = supabase.from("orders").select("id, status, carrier_delivered");
        
        if (orderId && orderId !== "order-001") { // Ignore dummy test IDs
            query = query.eq("id", orderId);
        } else {
            query = query.eq("tracking_number", trackingNumber);
        }

        const { data: orders, error: findError } = await query;

        if (findError || !orders || orders.length === 0) {
            console.warn(`[webhook/whereparcel] Order not found for tracking ${trackingNumber} / clientId ${orderId}`);
            return NextResponse.json({ message: "Order processed, but no matching database record found" }, { status: 200 });
        }

        // 4. Update Protocol Status
        for (const order of orders) {
            const updates: any = {
                carrier_last_status: currentStatus,
                carrier_updated_at: new Date().toISOString()
            };

            // Auto-complete delivery status in DB if carrier reports it
            if (currentStatus === "delivered" && !order.carrier_delivered) {
                updates.carrier_delivered = true;
                updates.carrier_delivered_at = new Date().toISOString();
                
                // If the order status is 'shipped', auto-advance to 'delivered'
                if (order.status === 'shipped') {
                    updates.status = 'delivered';
                }
            }

            const { error: updateError } = await supabase
                .from("orders")
                .update(updates)
                .eq("id", order.id);

            if (updateError) {
                console.error(`[webhook/whereparcel] Failed to sync order ${order.id}:`, updateError.message);
            } else {
                console.log(`[webhook/whereparcel] Synced order ${order.id} status: ${currentStatus}`);
            }
        }

        return NextResponse.json({ success: true, processed: true });
    } catch (err: any) {
        console.error("[webhook/whereparcel] Fatal error processing webhook:", err.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
