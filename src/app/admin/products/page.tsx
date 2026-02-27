import { getSupabaseAdmin } from "@/lib/supabase";
import { Plus, ChevronLeft } from "lucide-react";
import Link from "next/link";
import ProductsListClient from "./ProductsListClient";

export default async function ProductsAdminPage() {
    const supabase = getSupabaseAdmin() as any;

    const { data: products, error } = await supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        return <div className="p-8 text-red-500 font-bold">Error loading products: {error.message}</div>;
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-white/5">
                <div>
                    <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-2 block">Catalog Management</span>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">Products</h1>
                </div>

                <div className="flex gap-4">
                    <Link
                        href="/admin/products/new"
                        className="hasbro-btn-primary px-8 py-3 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add New Masterpiece
                    </Link>
                </div>
            </div>

            <ProductsListClient initialProducts={products || []} />
        </div>
    );
}
