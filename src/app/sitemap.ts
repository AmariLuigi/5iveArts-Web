import { MetadataRoute } from 'next';
import { fetchProductsFromDb } from '@/lib/products';
import { locales } from '@/lib/get-dictionary';

/**
 * Generates the search-engine-optimized sitemap for 5iveArts.
 * Targets the canonical 'www' domain and current EU-supported languages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.5ivearts.com';
  const lastModified = new Date();

  // 1. Fetch products from database (for dynamic product pages)
  const products = await fetchProductsFromDb();

  // 2. Define principal static routes
  const staticRoutes = ['', '/products', '/faq', '/shipping', '/privacy', '/terms'];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // 3. Multilingual SEO Mapping: Static Routes
  for (const lang of locales) {
    for (const route of staticRoutes) {
      const isHome = route === '';
      sitemapEntries.push({
        url: `${baseUrl}/${lang}${route}`,
        lastModified,
        changeFrequency: isHome ? 'daily' : 'weekly',
        priority: isHome ? 1.0 : (route === '/products' ? 0.9 : 0.6),
      });
    }

    // 4. Multilingual SEO Mapping: Dynamic Product Pages
    for (const product of products) {
      sitemapEntries.push({
        url: `${baseUrl}/${lang}/products/${product.id}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  return sitemapEntries;
}
