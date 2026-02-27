import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import OrderDetailClient from "./OrderDetailClient";

interface Props {
    params: Promise<{
        id: string;
    }>;
}

export default async function OrderDetailPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();

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

    return (
        <OrderDetailClient
            order={order}
            orderItems={orderItems || []}
        />
    );
}
