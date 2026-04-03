export type MarketCategory = "all" | "accessories" | "apparel" | "collectibles";

export type MarketSize = "XS" | "S" | "M" | "L" | "XL";

export interface MarketProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  category: Exclude<MarketCategory, "all">;
  image: string;
  imgSrc?: string;
  sizes?: MarketSize[];
  colors: string[];
}

export interface RedemptionReceipt {
  orderId: string;
  product: MarketProduct;
  color: string;
  size: MarketSize | null;
  quantity: number;
  totalCost: number;
  remainingXP: number;
  date: string;
  time: string;
}
