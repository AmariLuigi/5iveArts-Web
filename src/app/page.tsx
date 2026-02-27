import { Brush, Printer, Truck, ShieldCheck } from "lucide-react";
import { fetchProductsFromDb } from "@/lib/products";
import HeroSection from "@/components/marketing/HeroSection";
import FeaturesSection, { Feature } from "@/components/marketing/FeaturesSection";
import FeaturedProducts from "@/components/marketing/FeaturedProducts";
import TestimonialsSection, { Testimonial } from "@/components/marketing/TestimonialsSection";
import CtaSection from "@/components/marketing/CtaSection";

const FEATURES: Feature[] = [
  {
    icon: <Brush className="w-7 h-7 text-brand-yellow" />,
    title: "Hand-Painted",
    text: "Each figure painted by hand with premium acrylics",
  },
  {
    icon: <Printer className="w-7 h-7 text-brand-yellow" />,
    title: "3D-Printed",
    text: "High-resolution resin prints at 0.025 mm layer height",
  },
  {
    icon: <Truck className="w-7 h-7 text-brand-yellow" />,
    title: "Fast Shipping",
    text: "Insured worldwide delivery with tracking",
  },
  {
    icon: <ShieldCheck className="w-7 h-7 text-brand-yellow" />,
    title: "Secure Checkout",
    text: "Payments handled safely by Stripe",
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Marcus T.",
    role: "Collector, London",
    quote:
      "The Spider-Man figure blew me away — the brush-work is incredible. Arrived perfectly packaged and ahead of schedule.",
    rating: 5,
  },
  {
    name: "Sophie R.",
    role: "Gift buyer",
    quote:
      "Bought the 3D-printed Master Chief as a birthday gift. My partner nearly cried. The detail is unreal for the price.",
    rating: 5,
  },
  {
    name: "Jake N.",
    role: "Artist & hobbyist",
    quote:
      "As someone who paints minis myself, I can appreciate the skill here. The resin prints are razor sharp.",
    rating: 4,
  },
];

export default async function HomePage() {
  const products = await fetchProductsFromDb();

  return (
    <div>
      <HeroSection
        primaryCta={{ label: "Shop Now", href: "/products" }}
      />

      <FeaturesSection features={FEATURES} />

      <FeaturedProducts
        heading="Featured Figures"
        products={products.slice(0, 3)}
        viewAllHref="/products"
      />

      <TestimonialsSection testimonials={TESTIMONIALS} />

      <CtaSection
        heading="Ready to own a piece of art?"
        subtext="Browse the full collection of hand-painted and 3D-printed action figures. Each one is made to order with care."
        cta={{ label: "Browse the Shop", href: "/products" }}
      />
    </div>
  );
}
