import { createClient } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import OrderLogisticsClient from "./OrderLogisticsClient";

interface Props {
    params: Promise<{
        id: string;
    }>;
}

export default async function OrderLogisticsPage({ params }: Props) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login?returnTo=/account/orders/" + id);
    }

    // Fetch the order and ensure it belongs to the user
    const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (orderError || !order) {
        // Check if it exists for someone else (security) or just doesn't exist
        const { data: exists } = await (supabase as any)
            .from("orders")
            .select("id")
            .eq("id", id)
            .single();
            
        if (exists) {
            // Unauthorized access attempt
            redirect("/account");
        }
        notFound();
    }

    // Fetch the order items
    const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", id);

    if (itemsError) {
        console.error(`[account] Error fetching items for order ${id}:`, itemsError);
    }

    return (
        <OrderLogisticsClient
            order={order}
            orderItems={orderItems || []}
        />
    );
}
