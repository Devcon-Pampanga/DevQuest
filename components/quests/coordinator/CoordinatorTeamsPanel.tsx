"use client";

import { useMemo } from "react";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";
import { TEAM_META } from "@/lib/seed/quests";
import type { VolunteerWithTier } from "@/hooks/useCoordinatorHubData";

const ALL_TEAM_IDS = Object.keys(TEAM_META);
const MAX_AVATARS = 5;

interface CoordinatorTeamsPanelProps {
  volunteers: VolunteerWithTier[];
}

interface TeamCardProps {
  teamId: string;
  members: VolunteerWithTier[];
  color: string;
  label: string;
  index: number;
}

function TeamCard({ members, color, label, index }: TeamCardProps) {
  const shown = members.slice(0, MAX_AVATARS);
  const overflow = members.length - MAX_AVATARS;

  return (
    <div
      className="rounded-xl border border-border overflow-hidden animate-fade-up"
      style={{
        backgroundColor: `${color}08`,
        borderColor: `${color}25`,
        animationDelay: `${160 + index * 40}ms`,
      }}
    >
      {/* Colored top stripe */}
      <div className="h-[2px] w-full" style={{ backgroundColor: color }} />

      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading text-xs font-bold text-text-primary leading-tight truncate" style={{ color }}>
            {label}
          </p>
          <span
            className="text-[10px] font-heading px-1.5 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: `${color}1A`, color }}
          >
            {members.length}
          </span>
        </div>

        {members.length === 0 ? (
          <p className="text-[11px] text-text-muted">No members yet</p>
        ) : (
          <div className="flex items-center gap-0.5">
            {shown.map((v) => {
              const url = buildAvatarUrl(v.username, v.avatarOptions ?? DEFAULT_AVATAR);
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={v.uid}
                  src={url}
                  alt={v.username}
                  title={v.username}
                  width={24}
                  height={24}
                  className="rounded-md border border-border -ml-1 first:ml-0 transition-transform hover:scale-110 hover:z-10 relative"
                  style={{ boxShadow: `0 0 0 1px ${color}40` }}
                />
              );
            })}
            {overflow > 0 && (
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-heading border border-border -ml-1 shrink-0"
                style={{ backgroundColor: `${color}1A`, color }}
              >
                +{overflow}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CoordinatorTeamsPanel({ volunteers }: CoordinatorTeamsPanelProps) {
  const teamMembers = useMemo(() => {
    const map: Record<string, VolunteerWithTier[]> = {};
    ALL_TEAM_IDS.forEach((id) => { map[id] = []; });
    volunteers.forEach((v) => {
      v.teams.forEach((teamId) => {
        if (map[teamId]) map[teamId].push(v);
      });
    });
    return map;
  }, [volunteers]);

  return (
    <div
      className="rounded-2xl border border-border overflow-hidden animate-fade-up"
      style={{ backgroundColor: "#1e1a2e", animationDelay: "120ms" }}
    >
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #F5C518, #F97316, #06B6D4, #9333EA, #22C55E)" }} />
      <div className="p-4">
        <p className="font-heading text-base font-bold text-text-primary mb-3 leading-tight">TEAMS</p>
        <div className="flex flex-col gap-2">
          {ALL_TEAM_IDS.map((teamId, i) => {
            const meta = TEAM_META[teamId];
            return (
              <TeamCard
                key={teamId}
                teamId={teamId}
                members={teamMembers[teamId]}
                color={meta.color}
                label={meta.label}
                index={i}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
