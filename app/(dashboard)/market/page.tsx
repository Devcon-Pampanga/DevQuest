"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "all" | "accessories" | "apparel" | "collectibles";
type Size = "XS" | "S" | "M" | "L" | "XL";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  colors: string[];
  image: string;
  category: Category;
  sizes?: Size[];
}

interface RedemptionReceipt {
  orderId: string;
  product: Product;
  color: string;
  size: Size | null;
  quantity: number;
  totalCost: number;
  remainingXP: number;
  date: string;
  time: string;
}

// ─── Product Data ─────────────────────────────────────────────────────────────

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "DEVCON Kids Lanyard",
    description: "Keep your essentials secure.",
    price: 250,
    colors: ["#4ade80", "#a855f7", "#facc15", "#1f2937"],
    image: "🪪",
    category: "accessories",
  },
  {
    id: 6,
    name: "DEVCON Kids Tote Bag",
    description: "Carry your gear in style.",
    price: 350,
    colors: ["#f8fafc", "#1f2937", "#facc15", "#4ade80"],
    image: "👜",
    category: "accessories",
  },
  {
    id: 2,
    name: "DEVCON Kids T-Shirt",
    description: "Sustainable, premium comfort.",
    price: 600,
    colors: ["#f8fafc", "#1f2937", "#a855f7", "#4ade80"],
    image: "👕",
    category: "apparel",
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: 3,
    name: "DEVCON Kids Hoodie",
    description: "Warm, functional, and stylish.",
    price: 1200,
    colors: ["#a855f7", "#1f2937", "#4ade80"],
    image: "🧥",
    category: "apparel",
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  {
    id: 4,
    name: "DEVCON Kids Plushie",
    description: "Your cuddly coding companion.",
    price: 800,
    colors: ["#f8fafc", "#4ade80", "#a855f7", "#facc15"],
    image: "🧸",
    category: "collectibles",
  },
  {
    id: 5,
    name: "DEVCON Kids Sticker Pack",
    description: "12 exclusive holographic stickers.",
    price: 180,
    colors: ["#f8fafc", "#4ade80", "#facc15", "#ef4444"],
    image: "✨",
    category: "collectibles",
  },
];

// ─── Color → Hue Rotation Helper ──────────────────────────────────────────────

function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return Math.round(h * 60 + 360) % 360;
}

function getHueRotate(hex: string): number {
  if (!hex || hex === "#1f2937" || hex === "#f8fafc") return 0;
  return hexToHue(hex) - 45;
}

// ─── Ka-ching Sound ───────────────────────────────────────────────────────────

function useKaching() {
  const audioCtx = useRef<AudioContext | null>(null);
  const play = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioCtx.current;
    const playTone = (freq: number, startTime: number, duration: number, gainVal: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration * 0.3);
      gain.gain.setValueAtTime(gainVal, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    playTone(1200, now, 0.08, 0.3);
    playTone(1600, now + 0.07, 0.08, 0.3);
    playTone(2000, now + 0.13, 0.12, 0.25);
    playTone(2400, now + 0.18, 0.18, 0.2);
  }, []);
  return play;
}

// ─── Dropdown Filter ──────────────────────────────────────────────────────────

const FILTER_OPTIONS: { label: string; value: Category | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Accessories", value: "accessories" },
  { label: "Apparel", value: "apparel" },
  { label: "Collectibles", value: "collectibles" },
];

interface FilterDropdownProps {
  active: Category | "all";
  onChange: (v: Category | "all") => void;
}

function FilterDropdown({ active, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  const activeLabel = FILTER_OPTIONS.find((o) => o.value === active)?.label ?? "All";
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-[#ffffff10] bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:border-red-700/40 transition-all"
      >
        <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
        </svg>
        Filter
        <span className="rounded-full bg-red-600/30 px-2 py-0.5 text-[10px] font-bold text-red-400">{activeLabel}</span>
        <svg className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-48 rounded-xl border border-[#ffffff10] bg-[#13131f] shadow-xl shadow-black/40 overflow-hidden">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`flex w-full items-center justify-between px-4 py-3 text-sm transition-colors ${active === opt.value ? "bg-red-600/20 text-red-400 font-semibold" : "text-gray-300 hover:bg-white/5 hover:text-white"}`}
            >
              {opt.label}
              {active === opt.value && (
                <svg className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Confirm Modal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  product: Product;
  selectedSize: Size | null;
  quantity: number;
  xp: number;
  onClose: () => void;
  onConfirm: () => void;
}

function ConfirmModal({ product, selectedSize, quantity, xp, onClose, onConfirm }: ConfirmModalProps) {
  const totalCost = product.price * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-red-900/40 bg-[#13131f] p-6 shadow-2xl shadow-red-950/30">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-500 hover:text-white transition">✕</button>

        <h2 className="mb-1 text-lg text-white" style={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700 }}>Confirm Redemption</h2>
        <p className="mb-5 text-sm text-gray-400">Review your order before confirming.</p>

        {/* Product summary */}
        <div className="mb-4 rounded-xl bg-white/5 border border-red-900/20 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-white/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl shrink-0">
              <span>{product.image}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm leading-tight">{product.name}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{product.description}</p>
            </div>
          </div>
          <div className="divide-y divide-white/5">

            {selectedSize && (
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-xs text-gray-500">Size</span>
                <span className="rounded-md border border-red-500/30 bg-red-600/15 px-2 py-0.5 text-xs font-bold text-red-400">{selectedSize}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-gray-500">Quantity</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">×{quantity}</span>
                {quantity > 1 && <span className="text-[10px] text-gray-600">{product.price.toLocaleString()} XP each</span>}
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-red-950/20">
              <span className="text-xs font-semibold text-gray-400">Total</span>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-extrabold text-white">{totalCost.toLocaleString()}</span>
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white">XP</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-3 rounded-lg bg-white/5 px-4 py-3 flex justify-between text-sm border border-red-900/20">
          <span className="text-gray-400">Your balance</span>
          <span className="font-semibold text-white">{xp.toLocaleString()} XP</span>
        </div>
        <div className="mb-5 rounded-lg bg-white/5 px-4 py-3 flex justify-between text-sm border border-red-900/20">
          <span className="text-gray-400">After redemption</span>
          <span className={`font-semibold ${xp - totalCost >= 0 ? "text-red-400" : "text-red-600"}`}>
            {(xp - totalCost).toLocaleString()} XP
          </span>
        </div>

        {xp < totalCost && (
          <p className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2 text-sm text-red-400">
            ⚠ Insufficient XP to redeem this item.
          </p>
        )}

        <button
          onClick={onConfirm}
          disabled={xp < totalCost}
          className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95"
        >
          {`Confirm & Redeem${quantity > 1 ? ` ×${quantity}` : ""}`}
        </button>
      </div>
    </div>
  );
}

// ─── Receipt Viewer Modal ──────────────────────────────────────────────────────

interface ReceiptViewerProps {
  receipt: RedemptionReceipt;
  onClose: () => void;
  fromHistory?: boolean;
}

function ReceiptViewer({ receipt, onClose, fromHistory }: ReceiptViewerProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const unitPrice = receipt.quantity > 1 ? Math.round(receipt.totalCost / receipt.quantity) : receipt.totalCost;
  const balancePct = Math.min((receipt.remainingXP / (receipt.remainingXP + receipt.totalCost)) * 100, 100).toFixed(1);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      // Dynamically load html2canvas
      await new Promise<void>((resolve, reject) => {
        if ((window as unknown as Record<string, unknown>).html2canvas) { resolve(); return; }
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load html2canvas"));
        document.head.appendChild(s);
      });
      const h2c = (window as unknown as Record<string, unknown>).html2canvas as (el: HTMLElement, opts: Record<string, unknown>) => Promise<HTMLCanvasElement>;
      const canvas = await h2c(receiptRef.current, {
        backgroundColor: "#13131f",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement("a");
      link.download = `DEVCON-Kids-Receipt-${receipt.orderId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6 overflow-y-auto">
      <div className="relative w-full max-w-sm">

        {/* Action bar */}
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-sm font-semibold text-gray-300">Your Receipt</p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 transition active:scale-95 disabled:opacity-60"
            >
              {downloading ? (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"/>
                </svg>
              )}
              {downloading ? "Saving…" : "Save"}
            </button>
            <button onClick={onClose} className="flex h-8 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-gray-400 hover:text-white transition">
              {fromHistory ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </>
              ) : "✕"}
            </button>
          </div>
        </div>

        {/* Receipt card — compact */}
        <div ref={receiptRef} className="rounded-2xl border border-white/6 bg-[#13131f] overflow-hidden shadow-2xl shadow-black/60">

          {/* Header — shorter */}
          <div className="bg-gradient-to-br from-[#7f1d1d] via-[#991b1b] to-[#7f1d1d] px-6 py-5 text-center">
            <p className="text-[10px] tracking-[3px] text-red-200 uppercase font-semibold mb-0.5">DEVCON Kids</p>
            <h2 className="text-xl font-extrabold text-white" style={{ fontFamily: "var(--font-heading), sans-serif" }}>Redemption Confirmed!</h2>
          </div>

          {/* Order meta — tight */}
          <div className="flex justify-between items-center px-5 py-2.5 bg-[#0d0d14] border-b border-white/5">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-gray-600">Order ID</p>
              <p className="text-xs font-bold text-red-400 font-mono">#{receipt.orderId}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-gray-600">Date</p>
              <p className="text-[10px] text-gray-400">{receipt.date}</p>
              <p className="text-[9px] text-gray-600">{receipt.time}</p>
            </div>
          </div>

          {/* Item details — compact */}
          <div className="px-5 py-4">
            <div className="rounded-xl bg-[#0d0d14] border border-white/5 p-3.5">
              <div className="flex items-center gap-2.5 mb-3 pb-3 border-b border-white/5">
                <span className="text-3xl">
                  {receipt.product.image}
                </span>
                <div>
                  <p className="text-sm font-extrabold text-white leading-tight" style={{ fontFamily: "var(--font-heading), sans-serif" }}>{receipt.product.name}</p>
                  <p className="text-[10px] text-gray-500">{receipt.product.description}</p>
                </div>
              </div>

              <div className="space-y-2">

                {/* Size */}
                {receipt.size && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-500">Size</span>
                    <span className="rounded border border-red-500/30 bg-red-600/15 px-2 py-0.5 text-[10px] font-bold text-red-400">{receipt.size}</span>
                  </div>
                )}
                {/* Quantity */}
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-500">Quantity</span>
                  <span className="rounded border border-red-500/30 bg-red-600/15 px-2.5 py-0.5 text-[11px] font-extrabold text-red-400">
                    {receipt.quantity} item{receipt.quantity > 1 ? "s" : ""}
                  </span>
                </div>
                {/* Unit price */}
                {receipt.quantity > 1 && (
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-gray-500">Unit Price</span>
                    <span className="text-[11px] text-gray-400">{unitPrice.toLocaleString()} XP × {receipt.quantity}</span>
                  </div>
                )}
                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-xs font-bold text-white">Total Spent</span>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-extrabold text-red-400" style={{ fontFamily: "var(--font-heading), sans-serif" }}>{receipt.totalCost.toLocaleString()}</span>
                    <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[8px] font-black text-white">XP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* XP Balance — compact */}
          <div className="mx-5 mb-4 rounded-xl bg-[#0d0d14] border border-white/5 px-4 py-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-600">Remaining XP</p>
              <div>
                <span className="text-base font-extrabold text-green-400" style={{ fontFamily: "var(--font-heading), sans-serif" }}>{receipt.remainingXP.toLocaleString()}</span>
                <span className="text-[10px] font-bold text-green-500 ml-1">XP</span>
              </div>
            </div>
            <div className="h-1 w-full rounded-full bg-white/6 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-green-800 to-green-400" style={{ width: `${balancePct}%` }} />
            </div>
          </div>

          {/* Claim note — compact */}
          <div className="mx-5 mb-4 rounded-xl border border-red-500/15 bg-red-950/10 px-4 py-3">
            <p className="text-[10px] font-bold text-red-400 mb-1">📦 How to claim</p>
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Show this at the <span className="text-gray-300 font-semibold">DEVCON Kids Merch Booth</span>. Staff will verify order <span className="text-red-400 font-mono font-bold">#{receipt.orderId}</span>.
            </p>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-white/5 text-center">
            <p className="text-[10px] text-gray-600">DEVCON Kids · Thank you for participating! 🎉</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Receipt History ──────────────────────────────────────────────────────────

interface ReceiptHistoryProps {
  receipts: RedemptionReceipt[];
  onSelect: (r: RedemptionReceipt) => void;
  onClose: () => void;
}

function ReceiptHistory({ receipts, onSelect, onClose }: ReceiptHistoryProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6">
      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-300">Receipt History</p>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-white transition text-sm">✕</button>
        </div>

        <div className="rounded-2xl border border-white/6 bg-[#13131f] overflow-hidden shadow-2xl shadow-black/60 max-h-[70vh] overflow-y-auto">
          {receipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="text-4xl mb-3">🧾</span>
              <p className="text-sm font-semibold text-gray-400">No receipts yet</p>
              <p className="text-xs text-gray-600 mt-1">Redeem an item to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {receipts.slice().reverse().map((r) => (
                <button
                  key={r.orderId}
                  onClick={() => onSelect(r)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left"
                >
                  {/* Icon */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-2xl shrink-0">
                    {r.product.image}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{r.product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-500">{r.time} · {r.date.split(",")[0]}</span>
                      {r.size && <span className="text-[9px] font-bold text-red-400 border border-red-500/30 rounded px-1">{r.size}</span>}
                      {r.quantity > 1 && <span className="text-[9px] text-gray-500">×{r.quantity}</span>}
                    </div>
                  </div>
                  {/* Cost */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold text-red-400">{r.totalCost.toLocaleString()}</p>
                    <p className="text-[9px] text-red-600 font-bold">XP</p>
                  </div>
                  {/* Arrow */}
                  <svg className="h-4 w-4 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Success Toast ─────────────────────────────────────────────────────────────

function SuccessToast({ onClose, onViewReceipt }: { onClose: () => void; onViewReceipt: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-red-500/30 bg-[#13131f] px-5 py-4 shadow-xl shadow-red-950/20">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/20 text-red-400 text-lg">✓</div>
      <div>
        <p className="text-sm font-semibold text-white">Redemption successful!</p>
        <p className="text-xs text-gray-400">Your receipt is ready to view.</p>
      </div>
      <button onClick={onViewReceipt} className="ml-2 rounded-lg bg-red-600/20 border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-600/30 transition">
        View Receipt
      </button>
      <button onClick={onClose} className="text-gray-500 hover:text-white text-xs transition">✕</button>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: Product;
  xp: number;
  onRedeem: (product: Product, size: Size | null) => void;
  isRedeemed: boolean; // this specific product has been redeemed
}

function ProductCard({ product, xp, onRedeem, isRedeemed }: ProductCardProps) {
  const [selectedSize, setSelectedSize] = useState<Size | null>(product.sizes?.[2] ?? null);
  const canAfford = xp >= product.price;
  const progress = Math.min((xp / product.price) * 100, 100);

  return (
    <div className="group relative flex flex-col rounded-2xl border border-[#ffffff0f] bg-[#13131f] overflow-hidden transition-all duration-300 hover:border-red-700/60 hover:shadow-lg hover:shadow-red-950/20">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-700/0 via-red-600 to-red-700/0 opacity-60 group-hover:opacity-100 transition-opacity" />

      <div className="flex h-52 items-center justify-center select-none bg-[#0d0d14]">
        <span className="transition-all duration-300" style={{ fontSize: "5rem", lineHeight: 1 }}>
          {product.image}
        </span>
      </div>

      <div className="flex flex-col flex-1 px-5 pt-4 pb-5 gap-0">
        <h3 className="text-white text-base leading-snug" style={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700 }}>{product.name}</h3>
        <p className="mt-0.5 text-xs text-gray-500">{product.description}</p>

        <div className="my-3 h-px bg-white/5" />



        {/* Size row */}
        {product.sizes && (
          <div className="flex items-center justify-start mb-3">
            <div className="flex gap-1">
              {product.sizes.map((s) => (
                <button key={s} onClick={() => setSelectedSize(s)}
                  className={`h-6 w-7 rounded-md text-[10px] font-bold transition-all border ${selectedSize === s ? "border-red-500 bg-red-600/25 text-red-400" : "border-white/8 bg-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-[1.6rem] leading-none text-white" style={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700 }}>{product.price.toLocaleString()}</span>
          <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-black text-white tracking-wide">XP</span>
        </div>

        {/* XP Progress bar */}
        {!canAfford && (
          <div className="mt-3 space-y-1.5">
            <div className="h-1 w-full rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[10px] text-gray-600 text-right">
              <span className="text-red-400 font-semibold">{(product.price - xp).toLocaleString()} XP</span> more needed
            </p>
          </div>
        )}

        <div className="flex-1 min-h-[12px]" />

        <button
          onClick={() => onRedeem(product, selectedSize)}
          disabled={isRedeemed || !canAfford || (!!product.sizes && !selectedSize)}
          className={`w-full rounded-xl py-2.5 text-sm font-bold transition-all active:scale-[0.98] disabled:cursor-not-allowed
            ${isRedeemed
              ? "bg-green-700/30 border border-green-600/40 text-green-400"
              : !canAfford
              ? "bg-red-600 text-white opacity-30"
              : "bg-red-600 text-white hover:bg-red-500"
            }`}
        >
          {isRedeemed
            ? "✓ Redeemed"
            : !canAfford
            ? "Not enough XP"
            : product.sizes && !selectedSize
            ? "Select a size"
            : "Redeem"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MarketPage() {
  const [xp, setXp] = useState(1240);
  const [xpPop, setXpPop] = useState<{ amount: number; key: number } | null>(null);
  const [activeFilter, setActiveFilter] = useState<Category | "all">("all");
  const [redeemedIds, setRedeemedIds] = useState<Set<number>>(new Set());
  const [confirmModal, setConfirmModal] = useState<{ product: Product; color: string; size: Size | null; quantity: number } | null>(null);
  const [receipt, setReceipt] = useState<RedemptionReceipt | null>(null);
  const [receiptHistory, setReceiptHistory] = useState<RedemptionReceipt[]>([]);
  const [showReceiptViewer, setShowReceiptViewer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const filtered = activeFilter === "all" ? PRODUCTS : PRODUCTS.filter((p) => p.category === activeFilter);
  const kaching = useKaching();

  useEffect(() => {
    const id = "xp-pop-keyframe";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      @keyframes xpPopUp {
        0%   { opacity: 1; transform: translateX(-50%) translateY(0px);   }
        30%  { opacity: 1; transform: translateX(-50%) translateY(10px);  }
        70%  { opacity: 0.8; transform: translateX(-50%) translateY(22px); }
        100% { opacity: 0;   transform: translateX(-50%) translateY(36px); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const handleRedeem = (product: Product, size: Size | null) => {
    setConfirmModal({ product, color: product.colors[0], size, quantity: 1 });
  };

  const handleConfirm = () => {
    if (!confirmModal) return;
    const totalCost = confirmModal.product.price * confirmModal.quantity;
    const remainingXP = xp - totalCost;
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
      date: now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
      time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };

    kaching();
    setXpPop({ amount: totalCost, key: Date.now() });
    setTimeout(() => setXpPop(null), 3500);
    setXp(remainingXP);
    setRedeemedIds((prev) => new Set(Array.from(prev).concat(newReceipt.product.id)));
    setReceipt(newReceipt);
    setReceiptHistory((prev) => [...prev, newReceipt]);
    setConfirmModal(null);
    setShowReceiptViewer(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 6000);
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] bg-gradient-to-br from-[#0d0d14] via-[#0f0e1a] to-[#0d0d14] text-white" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>

      <header className="flex items-center justify-between px-6 py-4 border-b border-[#ffffff0a]">
        <h1 className="text-xl tracking-tight text-white" style={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700 }}>Market</h1>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-1.5 rounded-full border border-red-600/50 bg-red-950/40 px-3 py-1.5 text-sm font-bold text-red-400">
            {xp.toLocaleString()}
            <span className="text-[10px] text-red-500">XP</span>
            {xpPop && (
              <span key={xpPop.key} className="pointer-events-none whitespace-nowrap text-sm font-bold text-red-400"
                style={{ animation: "xpPopUp 3.5s ease-out forwards", position: "absolute", top: "100%", left: "50%", marginTop: "4px" }}>
                -{xpPop.amount.toLocaleString()} XP
              </span>
            )}
          </div>
          {/* Receipt history button */}
          <button
            onClick={() => setShowHistory(true)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#ffffff0f] bg-white/5 text-gray-400 hover:text-white transition"
            title="Receipt History"
          >
            🧾
            {receiptHistory.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white">
                {receiptHistory.length}
              </span>
            )}
          </button>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-red-600 to-rose-900 flex items-center justify-center text-sm font-bold text-white">U</div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pt-8 pb-2">
        <div className="rounded-2xl border border-red-900/40 bg-[#ffffff08] px-6 py-5 flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-red-500 mb-1">MERCH STORE</p>
            <p className="text-lg text-white" style={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700 }}>
              Redeem your XP for exclusive <span className="text-red-400">DEVCON Kids</span> merch.
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <span className="text-3xl text-red-500" style={{ fontFamily: "var(--font-heading), sans-serif", fontWeight: 700 }}>{xp.toLocaleString()}</span>
            <p className="text-xs text-gray-500 mt-0.5">XP available</p>
          </div>
        </div>
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-400">Showing <span className="text-white font-semibold">{filtered.length}</span> item{filtered.length !== 1 ? "s" : ""}</p>
          <FilterDropdown active={activeFilter} onChange={setActiveFilter} />
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} xp={xp} onRedeem={handleRedeem} isRedeemed={redeemedIds.has(p.id)} />
          ))}
        </div>
      </main>

      {/* Confirm modal */}
      {confirmModal && (
        <ConfirmModal
          product={confirmModal.product}
          selectedSize={confirmModal.size}
          quantity={confirmModal.quantity}
          xp={xp}
          onClose={() => setConfirmModal(null)}
          onConfirm={handleConfirm}
        />
      )}

      {/* Receipt history */}
      {/* Receipt history — hidden while viewer is open */}
      {showHistory && !showReceiptViewer && (
        <ReceiptHistory
          receipts={receiptHistory}
          onSelect={(r) => { setReceipt(r); setShowReceiptViewer(true); }}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Receipt viewer */}
      {showReceiptViewer && receipt && (
        <ReceiptViewer
          receipt={receipt}
          fromHistory={showHistory}
          onClose={() => setShowReceiptViewer(false)}
        />
      )}

      {/* Toast */}
      {showToast && !showReceiptViewer && (
        <SuccessToast
          onClose={() => setShowToast(false)}
          onViewReceipt={() => { setShowReceiptViewer(true); setShowToast(false); }}
        />
      )}
    </div>
  );
}