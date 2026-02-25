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
    <section className="bg-indigo-50 border-t border-indigo-100 py-16 px-4 text-center">
      <h2 className="text-3xl font-bold text-indigo-900 mb-4">{heading}</h2>
      <p className="text-indigo-600 mb-8 max-w-xl mx-auto">{subtext}</p>
      <Link
        href={cta.href}
        className="bg-indigo-600 text-white font-bold px-10 py-3 rounded-xl hover:bg-indigo-700 transition-colors inline-block"
      >
        {cta.label}
      </Link>
    </section>
  );
}
