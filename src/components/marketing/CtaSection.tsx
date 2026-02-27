import Link from "next/link";

export interface CtaSectionProps {
  heading: string;
  subtext: string;
  cta: { label: string; href: string };
}

/**
 * Full-width call-to-action banner, reusable at the bottom of any marketing page.
 */
export default function CtaSection({ heading, subtext, cta }: CtaSectionProps) {
  return (
    <section className="bg-[#050505] py-32 px-4 text-center border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-4 block">Limited production</span>
        <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white mb-8">
          {heading}
        </h2>
        <p className="text-neutral-500 mb-12 max-w-xl mx-auto font-bold uppercase tracking-widest text-[11px] leading-relaxed">
          {subtext}
        </p>
        <Link
          href={cta.href}
          className="hasbro-btn-primary px-16 py-6 inline-block"
        >
          {cta.label}
        </Link>
      </div>
    </section>
  );
}
