"use client";

export function SettingsFormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-sans uppercase tracking-widest text-text-muted">{label}</label>
      {children}
    </div>
  );
}
