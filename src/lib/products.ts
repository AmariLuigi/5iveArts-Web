import { Product } from "@/types";

export const products: Product[] = [
  {
    id: "hp-spider-man-001",
    name: "Hand-Painted Spider-Man",
    description:
      "A stunning hand-painted Spider-Man action figure, individually crafted with acrylic paints and sealed with a protective varnish. Each piece is unique with subtle variations in the brush strokes.",
    price: 8999,
    images: ["/images/products/hp-spider-man.jpg"],
    category: "hand-painted",
    stock: 5,
    details: [
      "Scale: 1:12 (6 inches)",
      "Material: PVC base with hand-applied acrylic paint",
      "Articulation: 14 points",
      "Protective UV-resistant varnish coating",
      "Ships in custom foam-padded box",
    ],
    rating: 4.9,
    reviewCount: 32,
  },
  {
    id: "hp-batman-002",
    name: "Hand-Painted Batman",
    description:
      "A dark and detailed hand-painted Batman figure featuring intricate cape weathering effects and glowing eye detail. Museum-quality paint work on every figure.",
    price: 9499,
    images: ["/images/products/hp-batman.jpg"],
    category: "hand-painted",
    stock: 3,
    details: [
      "Scale: 1:12 (6 inches)",
      "Material: PVC base with hand-applied acrylic paint",
      "Articulation: 16 points",
      "Weathered cape effect",
      "Glow-in-the-dark eye lenses",
    ],
    rating: 4.8,
    reviewCount: 19,
  },
  {
    id: "hp-wonder-woman-003",
    name: "Hand-Painted Wonder Woman",
    description:
      "A breathtaking hand-painted Wonder Woman featuring gold leaf detail on her armour and a flowing fabric cape. Every figure is a wearable piece of art.",
    price: 9999,
    images: ["/images/products/hp-wonder-woman.jpg"],
    category: "hand-painted",
    stock: 4,
    details: [
      "Scale: 1:12 (6 inches)",
      "Material: PVC base with hand-applied acrylic paint + real gold leaf",
      "Articulation: 14 points",
      "Real fabric cape",
      "Custom display base included",
    ],
    rating: 5.0,
    reviewCount: 11,
  },
  {
    id: "3dp-mandalorian-004",
    name: "3D-Printed Mandalorian",
    description:
      "A high-detail home 3D-printed Mandalorian figure printed in premium resin for crisp detail on every plate of beskar armour. Primed and ready for display or custom painting.",
    price: 4999,
    images: ["/images/products/3dp-mandalorian.jpg"],
    category: "home-printed",
    stock: 10,
    details: [
      "Scale: 1:12 (6 inches)",
      "Material: Premium photopolymer resin",
      "Layer resolution: 0.025mm",
      "Pre-sanded and primed",
      "Includes display stand",
    ],
    rating: 4.7,
    reviewCount: 28,
  },
  {
    id: "3dp-iron-man-005",
    name: "3D-Printed Iron Man MK-IV",
    description:
      "Precision 3D-printed Iron Man MK-IV armour with panel-line engraving and pre-drilled LED points. Perfect for collectors who want to add their own lighting effects.",
    price: 5499,
    images: ["/images/products/3dp-iron-man.jpg"],
    category: "home-printed",
    stock: 8,
    details: [
      "Scale: 1:12 (6 inches)",
      "Material: Premium photopolymer resin",
      "Layer resolution: 0.025mm",
      "LED holes pre-drilled in chest and eyes",
      "All panels individually printed for crisp lines",
    ],
    rating: 4.8,
    reviewCount: 41,
  },
  {
    id: "3dp-master-chief-006",
    name: "3D-Printed Master Chief",
    description:
      "A faithful 3D-printed recreation of Master Chief's Mjolnir armour. Every surface detail from the games has been faithfully translated into this high-resolution resin print.",
    price: 5999,
    images: ["/images/products/3dp-master-chief.jpg"],
    category: "home-printed",
    stock: 6,
    details: [
      "Scale: 1:12 (6 inches)",
      "Material: Premium photopolymer resin",
      "Layer resolution: 0.025mm",
      "Battle-worn surface details",
      "Includes MA5B Assault Rifle accessory",
    ],
    rating: 4.9,
    reviewCount: 23,
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(
  category: Product["category"]
): Product[] {
  return products.filter((p) => p.category === category);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(cents / 100);
}
