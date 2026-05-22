"use client";

import { DevCoin } from "@/components/market/DevCoin";
import type { MarketProduct, MarketSize } from "@/components/market/types";

interface ConfirmModalProps {
  product: MarketProduct;
  selectedSize: MarketSize | null;
  quantity: number;
  devCoins: number;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function ConfirmModal({
  product,
  selectedSize,
  quantity,
  devCoins,
  onClose,
  onConfirm,
  isLoading = false,
  error = null,
}: ConfirmModalProps) {
  const totalCost = product.price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-elevated p-6 shadow-2xl shadow-black/40 animate-modal-in">
        <button type="button" onClick={onClose} disabled={isLoading} className="absolute right-4 top-4 text-text-muted transition hover:text-text-primary disabled:pointer-events-none">
          x
        </button>

        <h2 className="mb-1 text-lg font-heading font-bold text-text-primary">Confirm Redemption</h2>
        <p className="mb-5 text-sm text-text-secondary">Review your order before confirming.</p>

        <div className="mb-4 overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-base text-sm font-heading font-bold text-text-primary">
              {product.image}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-heading font-bold leading-tight text-text-primary">{product.name}</p>
              <p className="mt-0.5 text-[11px] text-text-secondary">{product.description}</p>
            </div>
          </div>

          <div className="divide-y divide-border">
            {selectedSize ? (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-text-secondary">Size</span>
                <span className="rounded-md border border-accent-primary/40 bg-accent-primary/15 px-2 py-0.5 text-xs font-heading font-medium text-accent-highlight">
                  {selectedSize}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-text-secondary">Quantity</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-heading font-medium text-text-primary">x{quantity}</span>
                {quantity > 1 ? (
                  <span className="flex items-center gap-1 text-[10px] leading-none text-text-muted">
                    {product.price.toLocaleString()} <DevCoin size={8} /> each
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center justify-between bg-base/60 px-4 py-3">
              <span className="text-xs font-semibold text-text-secondary">Total</span>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-lg font-heading font-bold text-text-primary">{totalCost.toLocaleString()}</span>
                <DevCoin size={8} />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3 flex justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm">
          <span className="text-text-secondary">Your balance</span>
          <span className="flex items-center gap-1 font-semibold leading-none text-text-primary">
            {devCoins.toLocaleString()} <DevCoin size={8} />
          </span>
        </div>
        <div className="mb-5 flex justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm">
          <span className="text-text-secondary">After redemption</span>
          <span className={`flex items-center gap-1 font-semibold leading-none ${devCoins - totalCost >= 0 ? "text-accent-highlight" : "text-rose-400"}`}>
            {(devCoins - totalCost).toLocaleString()} <DevCoin size={8} />
          </span>
        </div>

        {devCoins < totalCost ? (
          <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
            Insufficient DevCoins to redeem this item.
          </p>
        ) : null}

        {error ? (
          <p className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onConfirm}
          disabled={devCoins < totalCost || isLoading}
          className="w-full rounded-xl bg-accent-highlight py-3 text-sm font-heading font-medium text-white transition hover:bg-accent-primary disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
        >
          {isLoading ? "Processing..." : "Confirm and Redeem"}
        </button>
      </div>
    </div>
  );
}
