"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { ConfirmModal } from "@/components/market/ConfirmModal";
import { PRODUCTS } from "@/components/market/data";
import { DevCoin } from "@/components/market/DevCoin";
import { FilterDropdown } from "@/components/market/FilterDropdown";
import { MarketSkeleton } from "@/components/market/MarketSkeleton";
import { ProductCard } from "@/components/market/ProductCard";
import { ReceiptHistory } from "@/components/market/ReceiptHistory";
import { ReceiptViewer } from "@/components/market/ReceiptViewer";
import { SuccessToast } from "@/components/market/SuccessToast";
import type { MarketCategory, MarketProduct, MarketSize, RedemptionReceipt } from "@/components/market/types";
import { useAuth } from "@/context/AuthContext";
import { useRequireDashboardAuth } from "@/hooks/useRequireDashboardAuth";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";

function useKaching() {
  const play = useCallback(() => {
    if (typeof window === "undefined") return;

    const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    const context = new AudioCtor();
    const notes = [
      [1200, 0, 0.08, 0.3],
      [1600, 0.07, 0.08, 0.3],
      [2000, 0.13, 0.12, 0.25],
      [2400, 0.18, 0.18, 0.2],
    ] as const;

    notes.forEach(([frequency, delay, duration, gainValue]) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + delay);
      oscillator.frequency.exponentialRampToValueAtTime(
        frequency * 1.5,
        context.currentTime + delay + duration * 0.3,
      );
      gain.gain.setValueAtTime(gainValue, context.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + delay + duration);
      oscillator.start(context.currentTime + delay);
      oscillator.stop(context.currentTime + delay + duration);
    });
  }, []);

  return play;
}

export function MarketPage() {
  const { user, status } = useAuth();
  const { ready } = useRequireDashboardAuth();
  const [loading, setLoading] = useState(true);
  const [devCoins, setDevCoins] = useState(0);
  const [activeFilter, setActiveFilter] = useState<MarketCategory>("all");
  const [redeemedIds, setRedeemedIds] = useState<Set<number>>(new Set());
  const [confirmModal, setConfirmModal] = useState<{
    product: MarketProduct;
    color: string;
    size: MarketSize | null;
    quantity: number;
  } | null>(null);
  const [receipt, setReceipt] = useState<RedemptionReceipt | null>(null);
  const [receiptHistory, setReceiptHistory] = useState<RedemptionReceipt[]>([]);
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const kaching = useKaching();

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      setDevCoins(user.xp ?? 0);
    }
  }, [user]);

  const authLoading = status === "loading" || !ready;
  const filtered = useMemo(() => {
    const items = activeFilter === "all" ? PRODUCTS : PRODUCTS.filter((product) => product.category === activeFilter);
    return items.slice().sort((a, b) => a.price - b.price);
  }, [activeFilter]);

  const avatarUrl = user
    ? buildAvatarUrl(user.username, user.avatarOptions ?? DEFAULT_AVATAR)
    : undefined;

  function handleRedeem(product: MarketProduct, size: MarketSize | null) {
    setConfirmModal({ product, color: product.colors[0], size, quantity: 1 });
  }

  function handleConfirm() {
    if (!confirmModal) return;

    const totalCost = confirmModal.product.price * confirmModal.quantity;
    const remainingXP = devCoins - totalCost;
    const orderId = `DK-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();

    const newReceipt: RedemptionReceipt = {
      orderId,
      product: confirmModal.product,
      color: confirmModal.color,
      size: confirmModal.size,
      quantity: confirmModal.quantity,
      totalCost,
      remainingXP,
      date: now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    kaching();
    setDevCoins(remainingXP);
    setRedeemedIds((previous) => new Set(Array.from(previous).concat(newReceipt.product.id)));
    setReceipt(newReceipt);
    setReceiptHistory((previous) => [...previous, newReceipt]);
    setConfirmModal(null);
    setShowReceiptViewer(true);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 6000);
  }

  if (authLoading || !user) {
    return <div className="px-4 py-6 sm:px-6"><MarketSkeleton /></div>;
  }

  return (
    <div className="flex-1">
      {loading ? <div className="px-4 py-6 sm:px-6"><MarketSkeleton /></div> : null}
      {!loading ? (
        <div
          className="min-h-screen bg-[#0d0d14] bg-gradient-to-br from-[#0d0d14] via-[#0f0e1a] to-[#0d0d14] text-white"
          style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
        >
          <header className="flex items-center justify-between border-b border-[#ffffff0a] px-6 py-4">
            <h1 className="text-xl tracking-tight text-white" style={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700 }}>
              Market
            </h1>
            <div className="flex items-center gap-3">
              <div className="relative flex items-center gap-1.5 rounded-full border border-yellow-600/40 bg-yellow-950/30 px-3 py-1.5 text-sm font-bold text-yellow-400">
                {devCoins.toLocaleString()}
                <DevCoin size={8} />
              </div>
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#ffffff0f] bg-white/5 text-gray-400 transition hover:text-white"
                title="Receipt History"
              >
                RC
                {receiptHistory.length > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white">
                    {receiptHistory.length}
                  </span>
                ) : null}
              </button>
              {avatarUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full border border-[#ffffff14] object-cover"
                  />
                </>
              ) : null}
            </div>
          </header>

        <div className="mx-auto max-w-5xl px-6 pb-2 pt-8">
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-900/40 bg-[#ffffff08] px-6 py-5">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-red-500">MERCH STORE</p>
              <p className="text-lg text-white" style={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700 }}>
                Redeem your DevCoins for exclusive <span className="text-red-400">DEVCON Kids</span> merch.
              </p>
            </div>
            <div className="hidden space-y-0.5 text-right sm:block">
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "var(--font-heading), sans-serif" }}>
                  {devCoins.toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-xs text-yellow-500">
                  <DevCoin size={8} /> DevCoins
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              Showing <span className="font-semibold text-white">{filtered.length}</span> item{filtered.length !== 1 ? "s" : ""}
            </p>
            <FilterDropdown active={activeFilter} onChange={setActiveFilter} />
          </div>
        </div>

        <main className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                xp={devCoins}
                onRedeem={handleRedeem}
                isRedeemed={redeemedIds.has(product.id)}
              />
            ))}
          </div>
        </main>

        {confirmModal ? (
          <ConfirmModal
            product={confirmModal.product}
            selectedSize={confirmModal.size}
            quantity={confirmModal.quantity}
            xp={devCoins}
            onClose={() => setConfirmModal(null)}
            onConfirm={handleConfirm}
          />
        ) : null}

        {showHistory && !showReceiptViewer ? (
          <ReceiptHistory
            receipts={receiptHistory}
            onSelect={(selectedReceipt) => {
              setReceipt(selectedReceipt);
              setShowReceiptViewer(true);
            }}
            onClose={() => setShowHistory(false)}
          />
        ) : null}

        {showReceiptViewer && receipt ? (
          <ReceiptViewer
            receipt={receipt}
            fromHistory={showHistory}
            onClose={() => setShowReceiptViewer(false)}
          />
        ) : null}

        {showToast && !showReceiptViewer ? (
          <SuccessToast
            onClose={() => setShowToast(false)}
            onViewReceipt={() => {
              setShowReceiptViewer(true);
              setShowToast(false);
            }}
          />
        ) : null}
        </div>
      ) : null}
    </div>
  );
}
