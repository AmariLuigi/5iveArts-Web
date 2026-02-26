import Link from "next/link";

export interface HeroSectionProps {
  headline: string;
  headlineHighlight?: string;
  subtext: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

/**
 * Full-width hero banner. Pass props to reuse on any marketing page.
 */
export default function HeroSection({
  headline,
  headlineHighlight,
  subtext,
  primaryCta,
  secondaryCta,
}: HeroSectionProps) {
  return (
    <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-800 text-white py-24 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          {headline}{" "}
          {headlineHighlight && (
            <span className="text-indigo-300">{headlineHighlight}</span>
          )}
        </h1>
        <p className="text-xl text-indigo-200 mb-10 leading-relaxed">
          {subtext}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href={primaryCta.href}
            className="bg-white text-indigo-900 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
          >
            {primaryCta.label}
          </Link>
          {secondaryCta && (
            <Link
              href={secondaryCta.href}
              className="border border-white/50 text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              {secondaryCta.label}
            </Link>
          )}
        </div>

        {/* Trust stats */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-2 text-indigo-200 text-sm">
          <span>⭐ 4.9 / 5 average rating</span>
          <span>🎨 500+ figures crafted</span>
          <span>🚚 Free UK shipping</span>
        </div>
      </div>
    </section>
  );
}
