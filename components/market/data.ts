import type { MarketCategory, MarketProduct } from "@/components/market/types";

export const FILTER_OPTIONS: { label: string; value: MarketCategory }[] = [
  { label: "All", value: "all" },
  { label: "Accessories", value: "accessories" },
  { label: "Apparel", value: "apparel" },
  { label: "Collectibles", value: "collectibles" },
];

export const PRODUCTS: MarketProduct[] = [
  {
    id: 1,
    name: "DK Lanyard",
    description: "Event-ready satin lanyard with DEVCON Kids branding.",
    price: 120,
    category: "accessories",
    image: "ID",
    colors: ["Crimson"],
  },
  {
    id: 2,
    name: "Sticker Pack",
    description: "Holographic merch stickers for laptops, notebooks, and cases.",
    price: 150,
    category: "collectibles",
    image: "ST",
    colors: ["Scarlet"],
  },
  {
    id: 3,
    name: "DevQuest Tee",
    description: "Heavy cotton shirt with chapter-back print and front crest.",
    price: 320,
    category: "apparel",
    image: "TEE",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Black", "Maroon"],
  },
  {
    id: 4,
    name: "Team Pin Set",
    description: "Five enamel pins inspired by the DEVCON Kids team tracks.",
    price: 210,
    category: "accessories",
    image: "PIN",
    colors: ["Mixed"],
  },
  {
    id: 5,
    name: "Volunteer Jacket",
    description: "A zip jacket for call times, setup days, and chapter travel.",
    price: 640,
    category: "apparel",
    image: "ZIP",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black"],
  },
  {
    id: 6,
    name: "Badge Archive Case",
    description: "Compact case for pins, cards, receipts, and event keepsakes.",
    price: 260,
    category: "collectibles",
    image: "ARC",
    colors: ["Smoke"],
  },
];
