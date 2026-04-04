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
        backgroundColor: "#16213e",
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
          <p className="text-sm font-heading font-medium text-text-primary">Your Receipt</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-xl bg-accent-highlight px-3 py-1.5 text-xs font-heading font-medium text-white transition hover:bg-accent-primary active:scale-95 disabled:opacity-60"
            >
              {downloading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 items-center justify-center gap-1 rounded-xl border border-border bg-surface px-3 text-xs text-text-muted transition hover:text-text-primary"
            >
              {fromHistory ? "Back" : "x"}
            </button>
          </div>
        </div>

        <div ref={receiptRef} className="overflow-hidden rounded-2xl border border-border bg-elevated shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-border bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.18),_transparent_55%)] px-5 py-4">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[2px] text-text-secondary">DEVCON Kids</p>
              <h2 className="text-base font-heading font-bold leading-tight text-text-primary">
                Redemption Confirmed!
              </h2>
            </div>
            <div className="text-right">
              <p className="font-mono text-[9px] font-bold text-accent-highlight">#{receipt.orderId}</p>
              <p className="text-[9px] text-text-muted">{receipt.time} | {receipt.date.split(",")[1]?.trim()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-base text-sm font-heading font-bold text-text-primary">
              {receipt.product.image}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-heading font-bold leading-tight text-text-primary">
                {receipt.product.name}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                {receipt.size ? (
                  <span className="rounded border border-accent-primary/40 px-1.5 py-0.5 text-[9px] font-heading font-medium text-accent-highlight">
                    {receipt.size}
                  </span>
                ) : null}
                <span className="text-[10px] text-text-secondary">Qty: {receipt.quantity}</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-base font-heading font-bold text-accent-highlight">
                {receipt.totalCost}
              </span>
              <span className="ml-1 inline-flex"><DevCoin size={8} /></span>
            </div>
          </div>

          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[10px] text-text-secondary">Remaining DevCoins</p>
            <div className="flex items-center gap-1">
              <span className="text-sm font-heading font-bold text-accent-highlight">{receipt.remainingDevCoins.toLocaleString()}</span>
              <DevCoin size={8} />
            </div>
          </div>

          <div className="mx-4 mb-4 rounded-lg border border-border bg-surface px-3 py-2.5">
            <p className="text-[10px] leading-relaxed text-text-secondary">
              Show this at the <span className="font-semibold text-text-primary">DEVCON Kids Merch Booth</span> - order{" "}
              <span className="font-mono text-accent-highlight">#{receipt.orderId}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
