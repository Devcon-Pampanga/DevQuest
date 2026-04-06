"use client";

export function LikertScale({
  label,
  required,
  leftLabel,
  rightLabel,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  leftLabel: string;
  rightLabel: string;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5">
      <p className="text-sm font-heading text-text-primary mb-4">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </p>
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="text-xs text-text-muted w-14 leading-tight text-right shrink-0">{leftLabel}</span>
        <div className="flex items-center gap-3 flex-1 justify-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="flex flex-col items-center gap-1 group"
            >
              <span className="text-xs text-text-muted">{n}</span>
              <div
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  value === n
                    ? "border-accent-highlight bg-accent-highlight"
                    : "border-border bg-surface group-hover:border-accent-primary"
                }`}
              />
            </button>
          ))}
        </div>
        <span className="text-xs text-text-muted w-14 leading-tight shrink-0">{rightLabel}</span>
      </div>
    </div>
  );
}
