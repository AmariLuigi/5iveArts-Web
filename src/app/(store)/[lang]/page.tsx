import dynamic from "next/dynamic";
import { Brush, Printer, Truck, ShieldCheck } from "lucide-react";
import { fetchProductsFromDb } from "@/lib/products";
import HeroSection from "@/components/marketing/HeroSection";
import { getSiteSettings } from "@/lib/settings";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getDictionary, Locale } from "@/lib/get-dictionary";
import { notFound } from "next/navigation";

// Dynamic imports for performance optimization with skeletons
const FeaturesSection = dynamic(() => import("@/components/marketing/FeaturesSection"), { 
  ssr: true,
  loading: () => <div className="h-96 bg-black/20 animate-pulse rounded-2xl m-4" /> 
});
const FeaturedProducts = dynamic(() => import("@/components/marketing/FeaturedProducts"), { 
  ssr: true,
  loading: () => <div className="h-[600px] bg-black/20 animate-pulse rounded-2xl m-4" />
});
const TestimonialsSection = dynamic(() => import("@/components/marketing/TestimonialsSection"), { 
  ssr: true,
  loading: () => <div className="h-80 bg-black/20 animate-pulse rounded-2xl m-4" />
});
const CtaSection = dynamic(() => import("@/components/marketing/CtaSection"), { 
  ssr: true,
  loading: () => <div className="h-64 bg-black/20 animate-pulse rounded-2xl m-4" />
});
const TrendingArtifacts = dynamic(() => import("@/components/marketing/TrendingArtifacts"), { 
  loading: () => <div className="h-96 bg-black/20 animate-pulse rounded-2xl m-4" />
});

import { type Feature } from "@/components/marketing/FeaturesSection";
import { type Testimonial } from "@/components/marketing/TestimonialsSection";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Validate locale
  const dict = await getDictionary(lang as Locale).catch(() => null) as any;
  if (!dict) notFound();

  const [products, settings] = await Promise.all([
    fetchProductsFromDb(),
    getSiteSettings()
  ]);

  const featuredIds = settings.homepage?.featured_product_ids || [];
  const featuredProducts = featuredIds.length > 0
    ? products.filter(p => featuredIds.includes(p.id))
    : products.slice(0, 3);

  const activeTestimonials = settings.homepage?.testimonials && settings.homepage.testimonials.length > 0
    ? settings.homepage.testimonials
    : [];

  const FEATURES: Feature[] = [
    {
      icon: <Brush className="w-7 h-7 text-brand-yellow" />,
      title: dict?.features?.handPainted?.title || "Hand Painted",
      text: dict?.features?.handPainted?.text || "Mastercraft finishes",
    },
    {
      icon: <Printer className="w-7 h-7 text-brand-yellow" />,
      title: dict?.features?.threeDPrinted?.title || "3D Printed",
      text: dict?.features?.threeDPrinted?.text || "Industry standard precision",
    },
    {
      icon: <Truck className="w-7 h-7 text-brand-yellow" />,
      title: dict?.features?.fastShipping?.title || "Fast Shipping",
      text: dict?.features?.fastShipping?.text || "European delivery",
    },
    {
      icon: <ShieldCheck className="w-7 h-7 text-brand-yellow" />,
      title: dict?.features?.secureCheckout?.title || "Secure Checkout",
      text: dict?.features?.secureCheckout?.text || "Encrypted payments",
    },
  ];

  return (
    <div className="relative">
      {/* Ambient background is provided globally in ConditionalLayout */}

      {/* Hero section */}
      <HeroSection
        primaryCta={{ label: dict?.hero?.cta || "Enter Vault", href: `/${lang}/products` }}
        heroVideos={settings.homepage?.hero_videos}
        heroPosters={settings.homepage ? (settings.homepage as any).hero_posters : []}
        translatedSlides={dict?.hero?.slides || []}
        trustLabels={dict?.hero?.trust || []}
      />

      <ScrollReveal>
        <FeaturesSection features={FEATURES} dict={dict} stats={settings.homepage?.stats} />
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <FeaturedProducts
          heading={dict?.homepage?.featuredHeading || "Featured Collections"}
          products={featuredProducts}
          viewAllHref={`/${lang}/products`}
          viewAllLabel={dict?.homepage?.viewAll || "View All"}
          lang={lang}
          dict={dict}
        />
      </ScrollReveal>

      <ScrollReveal>
        <TrendingArtifacts lang={lang} dict={dict} />
      </ScrollReveal>

      <ScrollReveal>
        <TestimonialsSection
          heading={dict?.homepage?.testimonialsHeading || "Trusted by Collectors"}
          reviewsLabel={dict?.homepage?.reviewsLabel || "Verified Reviews"}
          testimonials={activeTestimonials}
          lang={lang}
        />
      </ScrollReveal>

      <ScrollReveal direction="down">
        <CtaSection
          heading={dict?.ctaSection?.heading || "Ready to upgrade your collection?"}
          subtext={dict?.ctaSection?.subtext || "Join thousands of European collectors."}
          cta={{ label: dict?.ctaSection?.button || "Shop Now", href: `/${lang}/products` }}
        />
      </ScrollReveal>
    </div>
  );
}
