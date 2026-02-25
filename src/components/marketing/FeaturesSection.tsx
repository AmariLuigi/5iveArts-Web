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
    <section className="py-16 px-4 bg-white">
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {features.map((f) => (
          <div key={f.title} className="p-4">
            <div className="flex justify-center mb-2">{f.icon}</div>
            <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
