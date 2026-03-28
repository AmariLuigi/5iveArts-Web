import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import OrderDetailClient from "./OrderDetailClient";

interface Props {
    params: Promise<{
        id: string;
    }>;
}

export default async function OrderDetailPage({ params }: Props) {
    const { id } = await params;
    const supabase = getSupabaseAdmin() as any;

    // Fetch the order
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

    if (orderError || !order) {
        notFound();
    }

    // Fetch the order items
    const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);

    if (itemsError) {
        console.error(`[admin] Error fetching items for order ${id}:`, itemsError);
    }

    // Fetch progress media
    const { data: progressMedia, error: mediaError } = await supabase
        .from("order_progress_media")
        .select("*")
        .eq("order_id", id)
        .order("created_at", { ascending: true });

    if (mediaError) {
        console.error(`[admin] Error fetching media for order ${id}:`, mediaError);
    }

    return (
        <OrderDetailClient
            key={order.updated_at || order.id}
            order={order}
            orderItems={orderItems || []}
            initialProgressMedia={progressMedia || []}
        />
    );
}
