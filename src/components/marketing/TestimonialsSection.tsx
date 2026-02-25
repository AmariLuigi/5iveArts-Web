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
    <section className="py-16 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-10">
          {heading}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-gray-50 rounded-2xl border border-gray-100 p-6 flex flex-col gap-3"
            >
              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < t.rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              {/* Quote */}
              <p className="text-gray-700 text-sm leading-relaxed italic flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              {/* Attribution */}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                {t.role && (
                  <p className="text-xs text-gray-400">{t.role}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
