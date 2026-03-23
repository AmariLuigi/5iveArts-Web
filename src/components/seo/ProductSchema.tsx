import { Product, WithContext } from 'schema-dts';
import { Product as ProductType } from '@/types';

interface ProductSchemaProps {
  product: ProductType;
  lang: string;
}

export default function ProductSchema({ product, lang }: ProductSchemaProps) {
  const schema: WithContext<Product> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images?.[0],
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: '5iveArts',
    },
    offers: {
      '@type': 'Offer',
      url: `https://5ivearts.com/${lang}/products/${product.id}`,
      priceCurrency: 'EUR',
      price: product.price / 100,
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
