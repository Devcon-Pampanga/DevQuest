"use client";

import { useState } from "react";
import { DevCoin } from "@/components/market/DevCoin";
import type { MarketProduct, MarketSize } from "@/components/market/types";

interface ProductCardProps {
  product: MarketProduct;
  xp: number;
  onRedeem: (product: MarketProduct, size: MarketSize | null) => void;
  isRedeemed: boolean;
}

export function ProductCard({ product, xp, onRedeem, isRedeemed }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<MarketSize | null>(product.sizes?.[2] ?? null);
  const canAfford = xp >= product.price;
  const progress = Math.min((xp / product.price) * 100, 100);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#ffffff0f] bg-[#13131f] transition-all duration-300 hover:border-red-700/60 hover:shadow-lg hover:shadow-red-950/20">
      <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-red-700/0 via-red-600 to-red-700/0 opacity-60 transition-opacity group-hover:opacity-100" />

      <div className="relative flex h-52 select-none items-center justify-center overflow-hidden bg-[#0d0d14]">
        <span className="text-5xl font-black tracking-[0.2em] text-white/90 transition-all duration-300 group-hover:scale-105">
          {product.image}
        </span>
        <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: 0.13 }}>
          {Array.from({ length: 12 }).map((_, index) => (
            <span
              key={index}
              className="absolute whitespace-nowrap text-[11px] font-bold uppercase tracking-widest text-white"
              style={{
                transform: "rotate(-35deg)",
                left: `${(index % 4) * 38 - 20}%`,
                top: `${Math.floor(index / 4) * 38 - 10}%`,
                letterSpacing: "0.15em",
              }}
            >
              SAMPLE
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-0 px-5 pb-5 pt-4">
        <h3 className="text-base font-bold leading-snug text-white" style={{ fontFamily: "var(--font-heading), sans-serif" }}>
          {product.name}
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">{product.description}</p>

        <div className="my-3 h-px bg-white/5" />

        {product.sizes ? (
          <div className="mb-3 flex items-center justify-start">
            <div className="flex gap-1">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`h-6 w-7 rounded-md border text-[10px] font-bold transition-all ${
                    selectedSize === size
                      ? "border-red-500 bg-red-600/25 text-red-400"
                      : "border-white/8 bg-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-[1.6rem] font-bold leading-none text-white" style={{ fontFamily: "var(--font-heading), sans-serif" }}>
            {product.price.toLocaleString()}
          </span>
          <DevCoin size={8} />
        </div>

        {!canAfford ? (
          <div className="mt-3 space-y-1.5">
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="flex justify-end gap-1 text-[10px] text-gray-600">
              <span className="font-semibold text-red-400">{(product.price - xp).toLocaleString()}</span>
              <DevCoin size={7} />
              <span>more needed</span>
            </p>
          </div>
        ) : null}

        <div className="min-h-[12px] flex-1" />

        <button
          type="button"
          onClick={() => onRedeem(product, selectedSize)}
          disabled={isRedeemed || !canAfford || (!!product.sizes && !selectedSize)}
          className={`w-full rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed ${
            isRedeemed
              ? "border border-green-600/40 bg-green-700/30 text-green-400"
              : !canAfford
                ? "bg-red-600 text-white opacity-30"
                : "bg-red-600 text-white hover:bg-red-500"
          }`}
        >
          {isRedeemed ? "Redeemed" : !canAfford ? "Not enough XP" : product.sizes && !selectedSize ? "Select a size" : "Redeem"}
        </button>
      </div>
    </div>
  );
}
