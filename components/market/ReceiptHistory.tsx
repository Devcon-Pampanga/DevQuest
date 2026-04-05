"use client";

import { DevCoin } from "@/components/market/DevCoin";
import type { RedemptionReceipt } from "@/components/market/types";

interface ReceiptHistoryProps {
  receipts: RedemptionReceipt[];
  onSelect: (receipt: RedemptionReceipt) => void;
  onClose: () => void;
}

export function ReceiptHistory({ receipts, onSelect, onClose }: ReceiptHistoryProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-sm animate-modal-in">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-heading font-medium text-text-primary">Receipt History</p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-surface text-sm text-text-muted transition hover:text-text-primary"
          >
            x
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto overflow-hidden rounded-2xl border border-border bg-elevated shadow-2xl shadow-black/40">
          {receipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <span className="mb-3 text-4xl text-accent-highlight">RCPT</span>
              <p className="text-sm font-heading font-medium text-text-primary">No receipts yet</p>
              <p className="mt-1 text-xs text-text-secondary">Redeem an item to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {receipts
                .slice()
                .reverse()
                .map((receipt) => (
                  <button
                    key={receipt.orderId}
                    type="button"
                    onClick={() => onSelect(receipt)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface text-xs font-heading font-bold text-text-primary">
                      {receipt.product.image}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-heading font-bold text-text-primary">{receipt.product.name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-[10px] text-text-muted">{receipt.time} | {receipt.date.split(",")[0]}</span>
                        {receipt.size ? (
                          <span className="rounded border border-accent-primary/40 px-1 text-[9px] font-heading font-medium text-accent-highlight">
                            {receipt.size}
                          </span>
                        ) : null}
                        {receipt.quantity > 1 ? <span className="text-[9px] text-text-muted">x{receipt.quantity}</span> : null}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-heading font-bold text-accent-highlight">{receipt.totalCost.toLocaleString()}</p>
                      <p className="mt-0.5 inline-flex"><DevCoin size={8} /></p>
                    </div>
                    <svg className="h-4 w-4 shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
