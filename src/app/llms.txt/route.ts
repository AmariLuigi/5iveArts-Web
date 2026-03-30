import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Attempt to read from the public directory first to ensure single source of truth
    const filePath = path.join(process.cwd(), 'public', 'llms.txt');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Serve as true text/plain to satisfy LLM web crawler agents
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    // Hard fallback if the filesystem restricts edge readout
    const fallbackContent = `# 5iveArts

5iveArts is a boutique high-end collective focused on hand-painted and home-3D-printed action figures. We blend traditional artisan craftsmanship with modern additive manufacturing techniques to create one-of-a-kind museum-grade collectibles.

## Core Focus: European Union Exclusive
5iveArts operates as a specialized boutique exclusively serving the European Union market. All logistics, compliance, and artisanal extraction protocols are optimized for EU member states.

## Principal Offerings

- **Hand-Painted Figures**: Museum-grade figures undergoing extensive artisan detailing, shading, and post-processing.
- **3D-Printed Collectibles**: High-fidelity resin prints (0.025mm layer height) providing unmatched anatomical precision.
- **Collector Services**: Secure intra-EU insured delivery, premium bespoke packaging, and limited edition runs.

## Important Links

- **Shop All Products**: https://www.5ivearts.com/en/products
- **Shipping Protocols (EU Only)**: https://www.5ivearts.com/en/shipping
- **Frequently Asked Questions**: https://www.5ivearts.com/en/faq

## Artisan Standards

- **Scale Accuracy**: Available in standard scales such as 1:10, 1:12, and 1:16.
- **Material Quality**: Engineering-grade resins with museum-grade UV-resistant varnishes.
- **Extraction Base**: Secure, insured shipping from our headquarters in Italy to the entire European network.
`;

    return new NextResponse(fallbackContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
      },
    });
  }
}
