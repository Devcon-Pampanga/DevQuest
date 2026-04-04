"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "@/components/layout/PageShell";
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
      setDevCoins(user.devCoins ?? 0);
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
    const remainingDevCoins = devCoins - totalCost;
    const orderId = `DK-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();

    const newReceipt: RedemptionReceipt = {
      orderId,
      product: confirmModal.product,
      color: confirmModal.color,
      size: confirmModal.size,
      quantity: confirmModal.quantity,
      totalCost,
      remainingDevCoins,
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
    setDevCoins(remainingDevCoins);
    setRedeemedIds((previous) => new Set(Array.from(previous).concat(newReceipt.product.id)));
    setReceipt(newReceipt);
    setReceiptHistory((previous) => [...previous, newReceipt]);
    setConfirmModal(null);
    setShowReceiptViewer(true);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 6000);
  }

  return (
    <PageShell
      title="Market"
      avatarUrl={avatarUrl}
      loading={authLoading || !user || loading}
      skeleton={<MarketSkeleton />}
      actions={
        !authLoading && user ? (
          <>
            <div className="hidden items-center gap-1.5 rounded-xl border border-accent-primary/40 bg-accent-primary/15 px-3 py-1.5 text-sm font-heading font-medium text-accent-highlight sm:flex">
              {devCoins.toLocaleString()}
              <DevCoin size={8} />
            </div>
            <button
              type="button"
              onClick={() => setShowHistory(true)}
              className="relative flex h-9 min-w-9 items-center justify-center rounded-xl border border-border bg-surface px-3 text-sm font-heading font-medium text-text-secondary transition-colors hover:border-accent-highlight hover:text-text-primary"
              title="Receipt History"
            >
              <span className="hidden sm:inline">Receipts</span>
              <span className="sm:hidden">RC</span>
              {receiptHistory.length > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent-highlight text-[9px] font-bold text-white">
                  {receiptHistory.length}
                </span>
              ) : null}
            </button>
          </>
        ) : null
      }
    >
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 lg:max-w-5xl">
          <section className="rounded-2xl border border-border bg-surface px-6 py-5">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent-highlight">Marketplace</p>
                <h2 className="font-heading text-2xl text-text-primary">
                  Redeem your DevCoins for exclusive DEVCON Kids merch.
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-text-secondary">
                  Browse collectibles, apparel, and accessories earned through your volunteer progress.
                </p>
              </div>
              <div className="hidden rounded-2xl border border-accent-primary/30 bg-base/80 px-4 py-3 text-right sm:block">
                <p className="text-[10px] uppercase tracking-[0.18em] text-text-muted">Current Balance</p>
                <div className="mt-1 flex items-center justify-end gap-2">
                  <span className="font-heading text-2xl text-text-primary">{devCoins.toLocaleString()}</span>
                  <DevCoin size={10} />
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-between gap-4">
            <p className="text-sm text-text-secondary">
              Showing <span className="font-semibold text-text-primary">{filtered.length}</span> item{filtered.length !== 1 ? "s" : ""}
            </p>
            <FilterDropdown active={activeFilter} onChange={setActiveFilter} />
          </section>

          <main className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                devCoins={devCoins}
                onRedeem={handleRedeem}
                isRedeemed={redeemedIds.has(product.id)}
              />
            ))}
          </main>
        </div>

        {confirmModal ? (
          <ConfirmModal
            product={confirmModal.product}
            selectedSize={confirmModal.size}
            quantity={confirmModal.quantity}
            devCoins={devCoins}
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
    </PageShell>
  );
}
