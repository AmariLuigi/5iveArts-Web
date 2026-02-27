import ProductForm from "../ProductForm";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
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
                <h1 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">New Masterpiece</h1>
            </div>

            <ProductForm />
        </div>
    );
}
