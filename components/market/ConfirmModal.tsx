"use client";

import { DevCoin } from "@/components/market/DevCoin";
import type { MarketProduct, MarketSize } from "@/components/market/types";

interface ConfirmModalProps {
  product: MarketProduct;
  selectedSize: MarketSize | null;
  quantity: number;
  xp: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  product,
  selectedSize,
  quantity,
  xp,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  const totalCost = product.price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-red-900/40 bg-[#13131f] p-6 shadow-2xl shadow-red-950/30">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 text-gray-500 transition hover:text-white">
          x
        </button>

        <h2 className="mb-1 text-lg font-bold text-white" style={{ fontFamily: "var(--font-heading), sans-serif" }}>
          Confirm Redemption
        </h2>
        <p className="mb-5 text-sm text-gray-400">Review your order before confirming.</p>

        <div className="mb-4 overflow-hidden rounded-xl border border-red-900/20 bg-white/5">
          <div className="flex items-center gap-3 border-b border-white/5 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 text-sm font-black text-white">
              {product.image}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight text-white">{product.name}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">{product.description}</p>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {selectedSize ? (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-500">Size</span>
                <span className="rounded-md border border-red-500/30 bg-red-600/15 px-2 py-0.5 text-xs font-bold text-red-400">
                  {selectedSize}
                </span>
              </div>
            ) : null}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-gray-500">Quantity</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">x{quantity}</span>
                {quantity > 1 ? (
                  <span className="flex items-center gap-1 text-[10px] text-gray-600">
                    {product.price.toLocaleString()} <DevCoin size={8} /> each
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center justify-between bg-red-950/20 px-4 py-3">
              <span className="text-xs font-semibold text-gray-400">Total</span>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold text-white">{totalCost.toLocaleString()}</span>
                <DevCoin size={8} />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3 flex justify-between rounded-lg border border-red-900/20 bg-white/5 px-4 py-3 text-sm">
          <span className="text-gray-400">Your balance</span>
          <span className="flex items-center gap-1 font-semibold text-white">
            {xp.toLocaleString()} <DevCoin size={8} />
          </span>
        </div>
        <div className="mb-5 flex justify-between rounded-lg border border-red-900/20 bg-white/5 px-4 py-3 text-sm">
          <span className="text-gray-400">After redemption</span>
          <span className={`flex items-center gap-1 font-semibold ${xp - totalCost >= 0 ? "text-red-400" : "text-red-600"}`}>
            {(xp - totalCost).toLocaleString()} <DevCoin size={8} />
          </span>
        </div>

        {xp < totalCost ? (
          <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            Insufficient DevCoins to redeem this item.
          </p>
        ) : null}

        <button
          type="button"
          onClick={onConfirm}
          disabled={xp < totalCost}
          className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
        >
          Confirm and Redeem
        </button>
      </div>
    </div>
  );
}
