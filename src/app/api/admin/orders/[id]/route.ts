import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { registerTrackingWebhook } from "@/lib/tracking";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;
    const { id } = await params;

    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(`
            *,
            order_items (*)
        `)
        .eq("id", id)
        .single();

    if (orderError) {
        console.error("[api/admin/orders] GET error:", orderError.message);
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 404 });
    }

    return NextResponse.json(order);
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin(req);
    if (!auth.authorized) return auth.response;

    const supabase = getSupabaseAdmin() as any;
    const { id } = await params;
    const body = await req.json();

    // Allow updating status, tracking_number, label_url, and custom fields
    const { 
        status, 
        tracking_number, 
        label_url, 
        total_pence, 
        subtotal_pence,
        base_price_pence,
        complexity_factor,
        shipping_pence,
        carrier_service_id,
        shipping_service_name
    } = body;

    // 1. Update the database record
    const { data: updatedOrder, error } = await supabase
        .from("orders")
        .update({
            status,
            tracking_number,
            label_url,
            total_pence,
            subtotal_pence: subtotal_pence !== undefined ? subtotal_pence : total_pence,
            base_price_pence,
            complexity_factor,
            shipping_pence,
            carrier_service_id,
            shipping_service_name,
            updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error("[api/admin/orders] PATCH error:", error.message);
        return NextResponse.json({ error: "Failed to update order" }, { status: 400 });
    }

    // 2. Automate Webhook Monitoring (WhereParcel)
    // Register if we have a tracking number and carrier name
    const activeTracking = tracking_number || updatedOrder.tracking_number;
    const activeCarrier = shipping_service_name || updatedOrder.shipping_service_name;

    if (activeTracking && activeCarrier && (status === 'shipped' || updatedOrder.status === 'shipped')) {
        try {
            console.log(`[api/admin/orders] Initializing real-time webhook for ${activeTracking} (${activeCarrier})`);
            await registerTrackingWebhook(activeCarrier, activeTracking, id);
        } catch (webhookErr: any) {
            console.error("[api/admin/orders] Webhook registration deferred/failed:", webhookErr.message);
        }
    }

    // 3. Update the line item price for custom orders only
    // This synchronization ensures the single artifact item reflects the latest quote
    if (updatedOrder.is_custom && (subtotal_pence !== undefined || total_pence !== undefined)) {
        const lineItemPrice = subtotal_pence !== undefined ? subtotal_pence : total_pence;
        if (lineItemPrice !== undefined) {
            await supabase
                .from("order_items")
                .update({ 
                    product_price_pence: lineItemPrice 
                })
                .eq("order_id", id);
        }
    }

    return NextResponse.json(updatedOrder);
}
