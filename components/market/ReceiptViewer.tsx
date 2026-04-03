"use client";

import { useRef, useState } from "react";
import { DevCoin } from "@/components/market/DevCoin";
import type { RedemptionReceipt } from "@/components/market/types";

interface ReceiptViewerProps {
  receipt: RedemptionReceipt;
  onClose: () => void;
  fromHistory?: boolean;
}

export function ReceiptViewer({ receipt, onClose, fromHistory }: ReceiptViewerProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    if (!receiptRef.current) return;
    setDownloading(true);

    try {
      await new Promise<void>((resolve, reject) => {
        if ((window as unknown as Record<string, unknown>).html2canvas) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load html2canvas"));
        document.head.appendChild(script);
      });

      const html2canvas = (window as unknown as Record<string, unknown>).html2canvas as (
        element: HTMLElement,
        options: Record<string, unknown>,
      ) => Promise<HTMLCanvasElement>;
      const canvas = await html2canvas(receiptRef.current, {
        backgroundColor: "#13131f",
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `DEVCON-Kids-Receipt-${receipt.orderId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-300">Your Receipt</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-500 active:scale-95 disabled:opacity-60"
            >
              {downloading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-gray-400 transition hover:text-white"
            >
              {fromHistory ? "Back" : "x"}
            </button>
          </div>
        </div>

        <div ref={receiptRef} className="overflow-hidden rounded-2xl border border-white/6 bg-[#13131f] shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between bg-gradient-to-br from-[#7f1d1d] via-[#991b1b] to-[#7f1d1d] px-5 py-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[2px] text-red-200">DEVCON Kids</p>
              <h2 className="text-base font-extrabold leading-tight text-white" style={{ fontFamily: "var(--font-heading), sans-serif" }}>
                Redemption Confirmed!
              </h2>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] font-bold text-red-300">#{receipt.orderId}</p>
              <p className="text-[9px] text-red-200/60">{receipt.time} | {receipt.date.split(",")[1]?.trim()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#0d0d14] text-sm font-black text-white">
              {receipt.product.image}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold leading-tight text-white" style={{ fontFamily: "var(--font-heading), sans-serif" }}>
                {receipt.product.name}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                {receipt.size ? (
                  <span className="rounded border border-red-500/30 px-1.5 py-0.5 text-[9px] font-bold text-red-400">
                    {receipt.size}
                  </span>
                ) : null}
                <span className="text-[10px] text-gray-500">Qty: {receipt.quantity}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-base font-extrabold text-red-400" style={{ fontFamily: "var(--font-heading), sans-serif" }}>
                {receipt.totalCost}
              </span>
              <span className="ml-1 inline-flex"><DevCoin size={8} /></span>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[10px] text-gray-500">Remaining DevCoins</p>
            <div className="flex items-center gap-1">
              <span className="text-sm font-extrabold text-green-400">{receipt.remainingXP.toLocaleString()}</span>
              <DevCoin size={8} />
            </div>
          </div>

          <div className="mx-4 mb-4 rounded-lg border border-red-500/15 bg-red-950/10 px-3 py-2.5">
            <p className="text-[10px] leading-relaxed text-gray-400">
              Show this at the <span className="font-semibold text-gray-200">DEVCON Kids Merch Booth</span> - order{" "}
              <span className="font-mono text-red-400">#{receipt.orderId}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
