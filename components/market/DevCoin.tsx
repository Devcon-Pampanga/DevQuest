"use client";

export function DevCoin({ size = 12 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-red-600 font-black text-white"
      style={{
        width: size + 6,
        height: size + 6,
        fontSize: Math.max(8, Math.round(size * 0.58)),
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      D
    </span>
  );
}
