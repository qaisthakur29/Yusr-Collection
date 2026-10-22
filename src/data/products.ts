export interface Product {
  id: string;
  slug: string;
  name: string;
  subname?: string;
  price: number;
  mrp: number;
  image: string;
  gallery?: string[];
  sizes: ('S' | 'M' | 'L' | 'XL' | 'XXL')[];
  description: string;
  category: 'Tees' | 'Hoodies';
  fabric: string;
  fit: string;
  tag?: string;
  badge?: string;
  details: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: 'yusr-01',
    slug: 'the-legacy-tee',
    name: 'THE LEGACY TEE',
    subname: 'No Matter What. Alhamdulillah.',
    price: 999,
    mrp: 1499,
    image: '/src/assets/images/product_legacy_tee_1792579728032.jpg',
    gallery: [
      '/src/assets/images/product_legacy_tee_1792579728032.jpg',
      '/assets/aistudio/HERO_SECTION_BANNER_83e65a6d.png',
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'The flagship piece of Yusr Collection. Designed with a dropped shoulder silhouette and crafted from pure 240 GSM combed cotton. Featuring our signature "NO MATTER WHAT. ALHAMDULILLAH." graphic back print and subtle chest emblem. Built for those who stand firm in their faith through every trial.',
    category: 'Tees',
    fabric: '240 GSM 100% Super-Combed French Terry Cotton',
    fit: 'Signature Boxy Oversized Drop-Shoulder Fit',
    tag: 'Flagship Drop',
    badge: 'BESTSELLER',
    details: [
      'Heavyweight 240 GSM pre-shrunk cotton fabric',
      'High-density fade-resistant DTF print',
      'Seamless ribbed crew neck collar (1.25" width)',
      'Double-needle stitching across hem and cuffs',
      'Custom made-to-order to eliminate waste and guarantee quality',
    ],
  },
  {
    id: 'yusr-02',
    slug: 'al-sabr-oversized-tee',
    name: 'AL-SABR OVERSIZED TEE',
    subname: 'Patience & Quiet Strength',
    price: 999,
    mrp: 1499,
    image: '/src/assets/images/product_sabr_tee_1792579727820.jpg',
    gallery: [
      '/src/assets/images/product_sabr_tee_1792579727820.jpg',
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'Finished in our signature Warm Sand hue, the Al-Sabr tee embodies poise in the storm. Embroidered chest calligraphy and minimal back typographic seal. 240 GSM heavy fabric that holds its architectural drape wash after wash.',
    category: 'Tees',
    fabric: '240 GSM 100% Combed Compact Cotton',
    fit: 'Relaxed Drop-Shoulder Fit',
    tag: 'Warm Sand Series',
    badge: 'LIMITED RUN',
    details: [
      'Warm Sand earthy tone with tonal embroidery',
      'Heavyweight breathable weave suitable for gym and street',
      'Side slit vents for comfortable movement',
      'Eco-friendly reactive dye process',
      'Pre-washed for zero shrinkage',
    ],
  },
  {
    id: 'yusr-03',
    slug: 'fajr-club-hoodie',
    name: 'FAJR CLUB HOODIE',
    subname: 'Awake Before the World',
    price: 1899,
    mrp: 2799,
    image: '/src/assets/images/product_fajr_hoodie_1792579728357.jpg',
    gallery: [
      '/src/assets/images/product_fajr_hoodie_1792579728357.jpg',
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'For the early morning discipline. Crafted from ultra-dense 400 GSM French Terry with double-layered hood without dangling drawstrings for a streamlined, aggressive streetwear profile. Keeps you warm during cold Fajr prayers and early training sessions.',
    category: 'Hoodies',
    fabric: '400 GSM Ultra-Heavy French Terry Cotton',
    fit: 'Structured Boxy Cut with Drop Shoulder',
    tag: 'Winter Armor',
    badge: 'NEW DROP',
    details: [
      '400 GSM luxury weighted loopback French Terry',
      'Double-ply structured hood that stays upright',
      'Seamless kangaroo pouch with concealed inner phone pocket',
      'Heavyweight ribbed cuff and hem',
      'Minimal tonal embroidery on left wrist',
    ],
  },
  {
    id: 'yusr-04',
    slug: 'ease-and-struggle-tee',
    name: 'EASE & STRUGGLE TEE',
    subname: 'Inna Ma\'al Usri Yusra',
    price: 999,
    mrp: 1499,
    image: '/src/assets/images/product_ease_tee_1792579728102.jpg',
    gallery: [
      '/src/assets/images/product_ease_tee_1792579728102.jpg',
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description:
      'Inspired by the verse that defines our brand: "Indeed, with hardship comes ease." Rendered in vintage chalk white with clean, modernist typographic arrangement. Designed for everyday wear, reminding you why you fight and who you trust.',
    category: 'Tees',
    fabric: '240 GSM 100% Super-Combed Cotton',
    fit: 'Signature Boxy Oversized Drop-Shoulder Fit',
    tag: 'Deen & Street',
    badge: 'ESSENTIAL',
    details: [
      'Chalk white vintage garment-washed finish',
      'Ultra-soft touch with high-density architectural collar',
      'High-definition silkscreen print with matte finish',
      'Reinforced shoulder-to-shoulder taping',
      'Ethically made-to-order in India',
    ],
  },
];

export const SIZE_CHART = [
  { size: 'S', chest: '42"', length: '28"', shoulder: '21"', sleeve: '8.5"' },
  { size: 'M', chest: '44"', length: '29"', shoulder: '22"', sleeve: '9.0"' },
  { size: 'L', chest: '46"', length: '30"', shoulder: '23"', sleeve: '9.5"' },
  { size: 'XL', chest: '48"', length: '31"', shoulder: '24"', sleeve: '10.0"' },
  { size: 'XXL', chest: '50"', length: '32"', shoulder: '25"', sleeve: '10.5"' },
];
