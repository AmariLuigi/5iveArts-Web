import { Organization, WithContext } from 'schema-dts';

export default function OrganizationSchema() {
  const schema: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '5iveArts',
    url: 'https://5ivearts.com',
    logo: 'https://5ivearts.com/logo.png', // Ensure this exists
    sameAs: [
      'https://www.instagram.com/5ivearts', // Placeholder - update with real links
      'https://www.facebook.com/5ivearts',
    ],
    description: 'Unique hand-painted and home 3D-printed action figures, crafted with passion. Every piece is a one-of-a-kind work of art.',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IT',
      addressLocality: 'Palermo',
      postalCode: '90100',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@5ivearts.com',
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
