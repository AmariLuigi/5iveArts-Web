import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createShipment, purchaseShipment, getShipmentLabel } from "@/lib/paccofacile";
import { registerTrackingWebhook } from "@/lib/tracking";

export async function POST(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const { orderId } = await req.json();
        if (!orderId) {
            return NextResponse.json({ error: "orderId is required" }, { status: 400 });
        }

        const supabase = getSupabaseAdmin() as any;

        // 1. Fetch Order details
        const { data: order, error: orderError } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .eq("id", orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        if (!order.carrier_service_id) {
            return NextResponse.json({ error: "Order has no carrier_service_id" }, { status: 400 });
        }

        // 2. Create Shipment Draft
        console.log(`[logistics/ship] Creating shipment for order ${orderId}...`);
        const shipmentId = await createShipment(order, order.order_items, order.carrier_service_id);

        // 3. Purchase Shipment
        console.log(`[logistics/ship] Purchasing shipment ${shipmentId}...`);
        const trackingNumber = await purchaseShipment(shipmentId);

        // 4. Fetch Label
        console.log(`[logistics/ship] Fetching label for shipment ${shipmentId}...`);
        const label = await getShipmentLabel(shipmentId);
        // In a real scenario, you'd upload this to Supabase Storage or similar.
        // For now, we expect the user might store the base64 or a link.
        // Since the user asked to store label_url on the order, we'll placeholder it.
        // Or store the shipmentId for future retrieval.
        const labelUrl = `SHIPMENT_ID:${shipmentId}`; 

        // 5. Update Order in DB
        const { error: updateError } = await supabase
            .from("orders")
            .update({
                tracking_number: trackingNumber,
                status: "shipped",
                label_url: labelUrl, // Storing reference
                updated_at: new Date().toISOString()
            })
            .eq("id", orderId);

        if (updateError) {
          throw new Error(`Failed to update order info: ${updateError.message}`);
        }

        // 6. Auto-Register WhereParcel Webhook
        try {
            console.log(`[logistics/ship] Registering WhereParcel webhook for tracking ${trackingNumber}...`);
            await registerTrackingWebhook(order.shipping_service_name, trackingNumber, orderId);
        } catch (webhookErr: any) {
            console.warn("[logistics/ship] Webhook registration failed (non-critical):", webhookErr.message);
        }

        return NextResponse.json({ 
            success: true, 
            shipmentId, 
            trackingNumber,
            labelBase64: label.content
        });

    } catch (err: any) {
        const errorDetail = err.response?.data?.message || err.message || "Failed to process shipment";
        console.error("[api/admin/logistics/ship] Fatal Error:", errorDetail);
        if (err.response?.data) {
            console.error("[api/admin/logistics/ship] API Response Data:", JSON.stringify(err.response.data, null, 2));
        }
        return NextResponse.json({ error: errorDetail }, { status: 500 });
    }
}
