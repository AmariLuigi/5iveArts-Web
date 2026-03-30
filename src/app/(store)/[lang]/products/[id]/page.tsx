import { notFound } from "next/navigation";
import { fetchProductsFromDb } from "@/lib/products";
import ProductDetailClient from "./ProductDetailClient";
import { locales } from "@/lib/get-dictionary";

interface Props {
  params: Promise<{ id: string; lang: string }>;
}

export async function generateStaticParams() {
  const products = await fetchProductsFromDb();
  const paths: { id: string; lang: string }[] = [];
  
  // Generate paths for every product in every supported language
  for (const product of products) {
    for (const lang of locales) {
      paths.push({ id: product.id, lang });
    }
  }
  
  return paths;
}

import { getDictionary, Locale } from "@/lib/get-dictionary";
import ProductSchema from "@/components/seo/ProductSchema";

export async function generateMetadata({ params }: Props) {
  const { id, lang } = await params;
  const products = await fetchProductsFromDb();
  const product = products.find(p => p.id === id);
  if (!product) return {};
  
  const metaDescription = (
    lang === 'en' ? product.description_en :
    lang === 'it' ? product.description_it :
    lang === 'de' ? product.description_de :
    lang === 'fr' ? product.description_fr :
    lang === 'es' ? product.description_es :
    lang === 'ru' ? product.description_ru :
    lang === 'tr' ? product.description_tr :
    lang === 'pt' ? product.description_pt :
    lang === 'nl' ? product.description_nl :
    lang === 'ja' ? product.description_ja :
    lang === 'ar' ? product.description_ar :
    lang === 'pl' ? product.description_pl :
    product.description
  ) || product.description;

  return {
    metadataBase: new URL('https://www.5ivearts.com'),
    title: `${product.name} — 5iveArts`,
    description: metaDescription,
    openGraph: {
      type: 'website', 
      title: `${product.name} | 5iveArts`,
      description: metaDescription,
      url: `https://www.5ivearts.com/${lang}/products/${product.id}`,
      images: [
        {
          url: product.images?.[0] || '/logo.svg',
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | 5iveArts`,
      description: metaDescription,
      images: [product.images?.[0] || '/logo.svg'],
    },
    alternates: {
      canonical: `/${lang}/products/${product.id}`,
      languages: Object.fromEntries(
        locales.map((locale) => [locale, `/${locale}/products/${product.id}`])
      ),
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id, lang } = await params;
  const dict = await getDictionary(lang as Locale).catch(() => null);
  
  if (!dict) notFound();

  const products = await fetchProductsFromDb();
  const product = products.find(p => p.id === id);
  if (!product) notFound();

  return (
    <>
      <ProductSchema product={product} lang={lang} />
      <ProductDetailClient product={product} lang={lang} dict={dict} />
    </>
  );
}

