"use client";

import { useState } from "react";
import { DevCoin } from "@/components/market/DevCoin";
import type { MarketProduct, MarketSize } from "@/components/market/types";

interface ProductCardProps {
  product: MarketProduct;
  devCoins: number;
  onRedeem: (product: MarketProduct, size: MarketSize | null) => void;
  isRedeemed: boolean;
}

export function ProductCard({ product, devCoins, onRedeem, isRedeemed }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<MarketSize | null>(product.sizes?.[2] ?? null);
  const canAfford = devCoins >= product.price;
  const progress = Math.min((devCoins / product.price) * 100, 100);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-0.5 hover:border-accent-highlight/60 hover:shadow-xl hover:shadow-accent-primary/10">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-highlight/60 to-transparent opacity-70 transition-opacity group-hover:opacity-100" />

      <div className="relative flex h-52 select-none items-center justify-center overflow-hidden bg-base">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.18),_transparent_55%)]" />
        {product.imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imgSrc}
            alt={product.name}
            className="relative z-10 h-4/5 w-4/5 object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="relative text-5xl font-heading font-bold tracking-[0.2em] text-text-primary transition-all duration-300 group-hover:scale-105">
            {product.image}
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-10">
          {Array.from({ length: 12 }).map((_, index) => (
            <span
              key={index}
              className="absolute whitespace-nowrap text-[11px] font-heading font-medium uppercase tracking-widest text-accent-highlight"
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

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="text-base font-heading font-bold leading-snug text-text-primary">{product.name}</h3>
        <p className="mt-0.5 text-xs text-text-secondary">{product.description}</p>

        <div className="my-3 h-px bg-border" />

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
                      ? "border-accent-highlight bg-accent-primary/20 text-accent-highlight"
                      : "border-border bg-base text-text-muted hover:border-text-secondary hover:text-text-secondary"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-[1.6rem] font-heading font-bold leading-none text-text-primary">
            {product.price.toLocaleString()}
          </span>
          <DevCoin size={8} />
        </div>

        {!canAfford ? (
          <div className="mt-3 space-y-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-base">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent-primary to-accent-highlight transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="flex justify-end gap-1 text-[10px] leading-none text-text-muted">
              <span className="font-semibold text-accent-highlight">{(product.price - devCoins).toLocaleString()}</span>
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
          className={`w-full rounded-xl border py-2.5 text-sm font-heading font-medium transition-all active:scale-[0.98] disabled:cursor-not-allowed ${
            isRedeemed
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : !canAfford
                ? "border-border bg-base text-text-muted opacity-60"
                : "border-accent-highlight bg-accent-highlight text-white hover:bg-accent-primary hover:border-accent-primary"
          }`}
        >
          {isRedeemed ? "Redeemed" : !canAfford ? "Not enough DevCoins" : product.sizes && !selectedSize ? "Select a size" : "Redeem"}
        </button>
      </div>
    </div>
  );
}
