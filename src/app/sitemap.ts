import { MetadataRoute } from 'next';
import { fetchProductsFromDb } from '@/lib/products';
import { locales } from '@/lib/get-dictionary';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://5ivearts.com';
  const lastModified = new Date();

  // 1. Fetch products from database
  const products = await fetchProductsFromDb();

  // 2. Define static routes
  const staticRoutes = ['', '/products', '/faq', '/shipping', '/privacy', '/terms'];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // 3. Generate entries for every language and static route
  for (const lang of locales) {
    for (const route of staticRoutes) {
      const isHome = route === '';
      sitemapEntries.push({
        url: `${baseUrl}/${lang}${route}`,
        lastModified,
        changeFrequency: isHome ? 'daily' : 'weekly',
        priority: isHome ? 1.0 : route === '/products' ? 0.8 : 0.5,
      });
    }

    // 4. Generate entries for every product in every language
    for (const product of products) {
      sitemapEntries.push({
        url: `${baseUrl}/${lang}/products/${product.id}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  return sitemapEntries;
}
