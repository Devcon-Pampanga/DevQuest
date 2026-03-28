import Link from "next/link";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";
import type { ChapterSessionUser } from "@/types/chapter";
import type { DashboardLeaderboardEntry } from "@/types/dashboard";

export function DashboardLeaderboardSnippet({
  leaderboard,
  currentUser,
  userLeaderboardRank,
  teamColor,
  avatarUrl,
}: {
  leaderboard: DashboardLeaderboardEntry[];
  currentUser: ChapterSessionUser;
  userLeaderboardRank: number | null;
  teamColor: string;
  avatarUrl: string;
}) {
  const firebaseUid = currentUser.uid;

  return (
    <div className="order-8 lg:order-none rounded-2xl bg-surface border border-border p-5 flex flex-col gap-3 animate-fade-up" style={{ animationDelay: "180ms" }}>
      <div className="flex items-center justify-between">
        <span className="font-heading text-sm text-text-primary uppercase tracking-widest">Leaderboard</span>
        <Link href="/chapter" className="text-xs text-accent-highlight hover:text-accent-primary transition-colors">
          View all →
        </Link>
      </div>
      {leaderboard.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-4 font-sans">No data yet</p>
      ) : (
        <div className="flex flex-col gap-1">
          {leaderboard.map((entry, i) => {
            const isCurrentUser = entry.uid === firebaseUid;
            const entryColor = isCurrentUser ? teamColor : "#A1A1AA";
            return (
              <div
                key={entry.uid}
                className="flex items-center gap-3 px-2 py-2 rounded-xl transition-colors"
                style={isCurrentUser ? { backgroundColor: `${teamColor}10`, border: `1px solid ${teamColor}25` } : {}}
              >
                <span
                  className="font-heading text-sm tabular-nums shrink-0 w-5 text-center"
                  style={{ color: i === 0 ? "#F5C518" : i === 1 ? "#A1A1AA" : i === 2 ? "#CD7F32" : "#52525B" }}
                >
                  {i + 1}
                </span>
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-border" style={{ backgroundColor: "#100c1a" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={buildAvatarUrl(entry.username, entry.avatarOptions ?? DEFAULT_AVATAR)}
                    alt=""
                    width={28}
                    height={28}
                    className="w-full h-full"
                  />
                </div>
                <span className="flex-1 text-xs font-sans text-text-primary truncate">
                  {entry.username}
                  {isCurrentUser && (
                    <span className="ml-1.5 text-[9px] font-sans uppercase tracking-wide" style={{ color: teamColor }}>
                      {" "}
                      you
                    </span>
                  )}
                </span>
                <span className="text-xs font-heading tabular-nums shrink-0" style={{ color: entryColor }}>
                  {(entry.xp ?? 0).toLocaleString()}
                </span>
              </div>
            );
          })}
          {userLeaderboardRank !== null && userLeaderboardRank > 5 && (
            <>
              <div className="flex items-center gap-2 px-2 py-1">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[10px] text-text-muted font-sans">your rank</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div
                className="flex items-center gap-3 px-2 py-2 rounded-xl"
                style={{ backgroundColor: `${teamColor}10`, border: `1px solid ${teamColor}25` }}
              >
                <span className="font-heading text-sm tabular-nums shrink-0 w-5 text-center text-text-muted">
                  {userLeaderboardRank}
                </span>
                <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-border" style={{ backgroundColor: "#100c1a" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl} alt="" width={28} height={28} className="w-full h-full" />
                </div>
                <span className="flex-1 text-xs font-sans text-text-primary truncate">
                  {currentUser.username}
                  <span className="ml-1.5 text-[9px] font-sans uppercase tracking-wide" style={{ color: teamColor }}>
                    {" "}
                    you
                  </span>
                </span>
                <span className="text-xs font-heading tabular-nums shrink-0" style={{ color: teamColor }}>
                  {(currentUser.xp ?? 0).toLocaleString()}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
