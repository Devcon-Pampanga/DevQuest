"use client";

import { useState } from "react";

const DEVCOIN_ICON_SRC = "/icons/devcoin.png";

export function DevCoin({ size = 12 }: { size?: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const dimension = size + 6;

  if (!imageFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={DEVCOIN_ICON_SRC}
        alt=""
        width={dimension}
        height={dimension}
        className="inline-block shrink-0 object-contain"
        style={{ width: dimension, height: dimension }}
        aria-hidden="true"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full border border-accent-highlight/40 bg-accent-primary/20 font-black text-accent-highlight"
      style={{
        width: dimension,
        height: dimension,
        fontSize: Math.max(8, Math.round(size * 0.58)),
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      D
    </span>
  );
}
