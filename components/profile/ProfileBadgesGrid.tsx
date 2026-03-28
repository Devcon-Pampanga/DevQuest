"use client";

import { useState } from "react";
import Image from "next/image";
import { LockIcon } from "@/components/ui/icons";
import type { VolunteerBadgeDef } from "@/lib/volunteerBadges";

function ProfileBadgeTile({ badge }: { badge: VolunteerBadgeDef }) {
  return (
    <div
      className="relative rounded-xl border border-border bg-[#0a0a0f] p-4 flex flex-col items-center gap-2 text-center group hover:scale-[1.03] transition-transform duration-200"
      title={badge.earned ? "Earned" : badge.description}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
          badge.earned ? "" : "grayscale opacity-50"
        }`}
        style={
          badge.earned
            ? { boxShadow: "0 0 0 2px #7C3AED", backgroundColor: "#1a1a2e" }
            : { backgroundColor: "#1a1a2e" }
        }
      >
        <Image src={badge.image} alt={badge.name} width={40} height={40} className="object-contain" />
      </div>
      {!badge.earned && (
        <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-600 flex items-center justify-center text-zinc-500">
          <LockIcon size={12} />
        </div>
      )}
      <p className="text-xs font-heading font-semibold text-text-primary leading-tight">{badge.name}</p>
    </div>
  );
}

export function ProfileBadgesGrid({ badges }: { badges: VolunteerBadgeDef[] }) {
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 6;

  const earned = badges.filter((b) => b.earned);
  const unearned = badges.filter((b) => !b.earned);
  const displayed = expanded ? badges : [...earned, ...unearned].slice(0, LIMIT);

  return (
    <div id="badges" className="rounded-2xl bg-surface border border-border p-6 flex flex-col gap-4 scroll-mt-24">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-lg text-text-primary">Badges</h3>
        <span className="text-xs text-text-muted font-sans">{earned.length} / {badges.length} earned</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {displayed.map((b) => (
          <ProfileBadgeTile key={b.id} badge={b} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full py-2 rounded-xl border border-border text-xs font-heading uppercase tracking-widest text-text-secondary hover:text-text-primary hover:border-accent-primary/50 transition-colors"
      >
        {expanded ? "Show Less" : `Show All ${badges.length} Badges`}
      </button>
    </div>
  );
}
