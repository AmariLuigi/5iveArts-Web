-- ============================================================
-- 5iveArts — Seed Data
-- Inserts the 6 products from src/lib/products.ts into the
-- `products` table.
--
-- Run AFTER 001_schema.sql.
-- Safe to re-run: uses INSERT … ON CONFLICT DO NOTHING.
-- ============================================================

INSERT INTO products (id, name, description, price, images, category, stock, details)
VALUES
  (
    'hp-spider-man-001',
    'Hand-Painted Spider-Man',
    'A stunning hand-painted Spider-Man action figure, individually crafted with acrylic paints and sealed with a protective varnish. Each piece is unique with subtle variations in the brush strokes.',
    8999,
    ARRAY['/images/products/hp-spider-man.jpg'],
    'hand-painted',
    5,
    ARRAY[
      'Scale: 1:12 (6 inches)',
      'Material: PVC base with hand-applied acrylic paint',
      'Articulation: 14 points',
      'Protective UV-resistant varnish coating',
      'Ships in custom foam-padded box'
    ]
  ),
  (
    'hp-batman-002',
    'Hand-Painted Batman',
    'A dark and detailed hand-painted Batman figure featuring intricate cape weathering effects and glowing eye detail. Museum-quality paint work on every figure.',
    9499,
    ARRAY['/images/products/hp-batman.jpg'],
    'hand-painted',
    3,
    ARRAY[
      'Scale: 1:12 (6 inches)',
      'Material: PVC base with hand-applied acrylic paint',
      'Articulation: 16 points',
      'Weathered cape effect',
      'Glow-in-the-dark eye lenses'
    ]
  ),
  (
    'hp-wonder-woman-003',
    'Hand-Painted Wonder Woman',
    'A breathtaking hand-painted Wonder Woman featuring gold leaf detail on her armour and a flowing fabric cape. Every figure is a wearable piece of art.',
    9999,
    ARRAY['/images/products/hp-wonder-woman.jpg'],
    'hand-painted',
    4,
    ARRAY[
      'Scale: 1:12 (6 inches)',
      'Material: PVC base with hand-applied acrylic paint + real gold leaf',
      'Articulation: 14 points',
      'Real fabric cape',
      'Custom display base included'
    ]
  ),
  (
    '3dp-mandalorian-004',
    '3D-Printed Mandalorian',
    'A high-detail home 3D-printed Mandalorian figure printed in premium resin for crisp detail on every plate of beskar armour. Primed and ready for display or custom painting.',
    4999,
    ARRAY['/images/products/3dp-mandalorian.jpg'],
    'home-printed',
    10,
    ARRAY[
      'Scale: 1:12 (6 inches)',
      'Material: Premium photopolymer resin',
      'Layer resolution: 0.025mm',
      'Pre-sanded and primed',
      'Includes display stand'
    ]
  ),
  (
    '3dp-iron-man-005',
    '3D-Printed Iron Man MK-IV',
    'Precision 3D-printed Iron Man MK-IV armour with panel-line engraving and pre-drilled LED points. Perfect for collectors who want to add their own lighting effects.',
    5499,
    ARRAY['/images/products/3dp-iron-man.jpg'],
    'home-printed',
    8,
    ARRAY[
      'Scale: 1:12 (6 inches)',
      'Material: Premium photopolymer resin',
      'Layer resolution: 0.025mm',
      'LED holes pre-drilled in chest and eyes',
      'All panels individually printed for crisp lines'
    ]
  ),
  (
    '3dp-master-chief-006',
    '3D-Printed Master Chief',
    'A faithful 3D-printed recreation of Master Chief''s Mjolnir armour. Every surface detail from the games has been faithfully translated into this high-resolution resin print.',
    5999,
    ARRAY['/images/products/3dp-master-chief.jpg'],
    'home-printed',
    6,
    ARRAY[
      'Scale: 1:12 (6 inches)',
      'Material: Premium photopolymer resin',
      'Layer resolution: 0.025mm',
      'Battle-worn surface details',
      'Includes MA5B Assault Rifle accessory'
    ]
  )
ON CONFLICT (id) DO NOTHING;
