import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/checkout/',
          '/*/admin/',
          '/*/api/',
          '/*/checkout/',
        ],
      },
    ],
    sitemap: 'https://5ivearts.com/sitemap.xml',
  };
}
