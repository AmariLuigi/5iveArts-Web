import { createClient } from "@/lib/supabase-server";
import ProductForm from "../ProductForm";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

interface Props {
    searchParams: Promise<{
        duplicate?: string;
    }>;
}

export default async function NewProductPage({ searchParams }: Props) {
    const { duplicate } = await searchParams;
    let initialData = null;

    if (duplicate) {
        const supabase = await createClient();
        const { data } = await supabase
            .from("products")
            .select("*")
            .eq("id", duplicate)
            .single();
        
        if (data) {
            // Remove the ID and timestamps to ensure it's treated as a new entry
            const { id, created_at, updated_at, ...sourceData } = data as any;
            initialData = {
                ...sourceData,
                name: `${sourceData.name} (Copy)`
            };
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">
            {/* Header */}
            <div className="flex flex-col gap-6 pb-10 border-b border-white/5">
                <div className="flex items-center gap-2 mb-4">
                    <Link href="/admin" className="text-[10px] uppercase font-black tracking-widest text-neutral-600 hover:text-brand-yellow transition-colors">Overview</Link>
                    <ChevronRight className="w-3 h-3 text-neutral-800" />
                    <Link href="/admin/products" className="text-[10px] uppercase font-black tracking-widest text-neutral-600 hover:text-brand-yellow transition-colors">Products</Link>
                    <ChevronRight className="w-3 h-3 text-neutral-800" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-brand-yellow">Deploy New Asset</span>
                </div>
                <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">
                    {initialData ? "Replicate Model" : "New Masterpiece"}
                </h1>
            </div>

            <ProductForm initialData={initialData} />
        </div>
    );
}
