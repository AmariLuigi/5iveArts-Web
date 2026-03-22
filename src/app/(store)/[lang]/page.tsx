import { Brush, Printer, Truck, ShieldCheck } from "lucide-react";
import { fetchProductsFromDb } from "@/lib/products";
import HeroSection from "@/components/marketing/HeroSection";
import FeaturesSection, { Feature } from "@/components/marketing/FeaturesSection";
import FeaturedProducts from "@/components/marketing/FeaturedProducts";
import TestimonialsSection, { Testimonial } from "@/components/marketing/TestimonialsSection";
import CtaSection from "@/components/marketing/CtaSection";
import { getSiteSettings } from "@/lib/settings";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { getDictionary, Locale } from "@/lib/get-dictionary";
import { notFound } from "next/navigation";

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  
  // Validate locale
  const dict = await getDictionary(lang as Locale).catch(() => null);
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
      title: dict.features.handPainted.title,
      text: dict.features.handPainted.text,
    },
    {
      icon: <Printer className="w-7 h-7 text-brand-yellow" />,
      title: dict.features.threeDPrinted.title,
      text: dict.features.threeDPrinted.text,
    },
    {
      icon: <Truck className="w-7 h-7 text-brand-yellow" />,
      title: dict.features.fastShipping.title,
      text: dict.features.fastShipping.text,
    },
    {
      icon: <ShieldCheck className="w-7 h-7 text-brand-yellow" />,
      title: dict.features.secureCheckout.title,
      text: dict.features.secureCheckout.text,
    },
  ];

  return (
    <div>
      <HeroSection
        primaryCta={{ label: dict.hero.cta, href: `/${lang}/products` }}
        heroVideos={settings.homepage?.hero_videos}
        translatedSlides={dict.hero.slides}
        trustLabels={dict.hero.trust}
      />

      <ScrollReveal>
        <FeaturesSection features={FEATURES} />
      </ScrollReveal>

      <ScrollReveal delay={0.2}>
        <FeaturedProducts
          heading={dict.homepage.featuredHeading}
          products={featuredProducts}
          viewAllHref={`/${lang}/products`}
          viewAllLabel={dict.homepage.viewAll}
          lang={lang}
          dict={dict}
        />
      </ScrollReveal>

      <ScrollReveal>
        <TestimonialsSection 
          heading={dict.homepage.testimonialsHeading}
          reviewsLabel={dict.homepage.reviewsLabel}
          testimonials={activeTestimonials} 
        />
      </ScrollReveal>

      <ScrollReveal direction="down">
        <CtaSection
          heading={dict.ctaSection.heading}
          subtext={dict.ctaSection.subtext}
          cta={{ label: dict.ctaSection.button, href: `/${lang}/products` }}
        />
      </ScrollReveal>
    </div>
  );
}
