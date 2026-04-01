import Link from "next/link";
import type { ChapterSessionUser } from "@/types/chapter";
import type { XpLevelProgress } from "@/lib/xpLevel";
import { XP_LEVEL_STEP } from "@/lib/xpLevel";

function displayName(raw: string) {
  return raw
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function DashboardIdentityHero({
  user,
  avatarUrl,
  teamColor,
  xpProgress,
  copiedShare,
  onShare,
}: {
  user: ChapterSessionUser;
  avatarUrl: string;
  teamColor: string;
  xpProgress: XpLevelProgress;
  copiedShare: boolean;
  onShare: () => void;
}) {
  return (
    <div
      className="order-1 lg:order-none relative rounded-2xl overflow-hidden animate-fade-up"
      style={{
        background: "linear-gradient(135deg, #5B21B6 0%, #7C3AED 45%, #A855F7 80%, #C084FC 100%)",
        animationDelay: "0ms",
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="p-5 relative z-10 flex flex-col gap-4">
        <div className="hidden sm:flex absolute top-5 right-5 z-20 gap-2">
          <Link
            href="/profile#badges"
            className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-heading uppercase tracking-wider transition-colors backdrop-blur-sm border border-white/20"
          >
            Badges
          </Link>
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-heading uppercase tracking-wider transition-colors backdrop-blur-sm border border-white/20"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span
              key={copiedShare ? "copied" : "share"}
              style={
                copiedShare
                  ? { animation: "pop 250ms cubic-bezier(0.16, 1, 0.3, 1) both", display: "inline-block" }
                  : undefined
              }
            >
              {copiedShare ? "Copied" : "Share"}
            </span>
          </button>
        </div>
        <div className="h-fit w-full flex flex-row items-center gap-4 min-w-0 sm:pr-[11rem]">
          <div
            className="relative shrink-0 size-[4.5rem] sm:size-20 rounded-xl overflow-hidden border-2"
            style={{ backgroundColor: "#100c1a", borderColor: teamColor }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl}
              alt="Profile avatar"
              width={80}
              height={80}
              className="block h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex flex-col justify-center gap-1 flex-1 leading-none">
            <h1 className="font-heading text-xl sm:text-2xl text-white leading-tight truncate min-h-0">
              {displayName(user.username)}
            </h1>
            <span className="inline-flex w-fit text-[10px] font-sans uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-white shrink-0 leading-normal mt-0.5">
              {user.role === "coordinator" ? "Coordinator" : "Volunteer"}
            </span>
            <p className="text-sm text-white/70 font-sans truncate leading-snug mt-0.5">{user.chapterId}</p>
          </div>
        </div>
        <div className="w-full pt-4 border-t border-white/15">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] text-white/60 font-sans uppercase tracking-widest">Level</p>
              <p className="font-heading text-2xl tabular-nums leading-none text-white mt-0.5">{xpProgress.level}</p>
            </div>
            <div className="text-right min-w-0">
              <p className="text-[10px] text-white/60 font-sans uppercase tracking-widest">Progress</p>
              <p className="font-heading text-lg sm:text-2xl tabular-nums leading-none text-white mt-0.5 whitespace-nowrap">
                {xpProgress.xpIntoLevel.toLocaleString()} / {XP_LEVEL_STEP.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${xpProgress.pctToNextLevel}%`,
                backgroundColor: teamColor,
              }}
            />
          </div>
        </div>
        <div className="flex sm:hidden gap-2">
          <Link
            href="/profile#badges"
            className="flex-1 inline-flex items-center justify-center px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-heading uppercase tracking-wider transition-colors backdrop-blur-sm border border-white/20"
          >
            Badges
          </Link>
          <button
            type="button"
            onClick={onShare}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-heading uppercase tracking-wider transition-colors backdrop-blur-sm border border-white/20"
          >
            {copiedShare ? "Copied" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
