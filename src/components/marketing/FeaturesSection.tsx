import { type ReactNode } from "react";

export interface Feature {
  icon: ReactNode;
  title: string;
  text: string;
}

export interface FeaturesSectionProps {
  features: Feature[];
}

/**
 * Responsive icon-grid of marketing feature highlights.
 */
export default function FeaturesSection({ features }: FeaturesSectionProps) {
  return (
    <section className="py-24 px-4 bg-[#050505] border-b border-[#111]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12">
        {features.map((f) => (
          <div key={f.title} className="flex flex-col items-center md:items-start text-center md:text-left group">
            <div className="mb-6 p-4 bg-[#111] rounded-2xl border border-white/5 group-hover:border-brand-yellow/30 transition-colors">
              {f.icon}
            </div>
            <h3 className="font-black uppercase tracking-widest text-sm text-white mb-2">{f.title}</h3>
            <p className="text-xs text-neutral-500 font-medium leading-relaxed">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
