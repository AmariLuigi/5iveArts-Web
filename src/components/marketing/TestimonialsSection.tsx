import { Star } from "lucide-react";

export interface Testimonial {
  name: string;
  role?: string;
  quote: string;
  rating: 1 | 2 | 3 | 4 | 5;
}

export interface TestimonialsSectionProps {
  heading?: string;
  testimonials: Testimonial[];
}

/**
 * Testimonials marketing section. Pass an array of customer quotes to render a
 * responsive card grid.
 */
export default function TestimonialsSection({
  heading = "What collectors are saying",
  testimonials,
}: TestimonialsSectionProps) {
  return (
    <section className="py-24 px-4 bg-[#000000] border-b border-[#111]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-[10px] uppercase font-black tracking-[0.4em] text-brand-yellow mb-2 block">Collector Reviews</span>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">
            {heading}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="hasbro-card p-8 flex flex-col gap-6"
            >
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i < t.rating
                        ? "text-brand-yellow fill-brand-yellow"
                        : "text-white/10 fill-white/10"
                      }`}
                  />
                ))}
              </div>
              {/* Quote */}
              <p className="text-white font-medium text-sm leading-[1.6]">
                &ldquo;{t.quote}&rdquo;
              </p>
              {/* Attribution */}
              <div className="mt-auto flex items-center gap-4 pt-6 border-t border-white/5">
                <div className="w-10 h-10 bg-brand-yellow/10 rounded-full flex items-center justify-center text-brand-yellow font-black text-xs">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-black uppercase tracking-tight text-white text-sm">{t.name}</p>
                  {t.role && (
                    <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">{t.role}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
