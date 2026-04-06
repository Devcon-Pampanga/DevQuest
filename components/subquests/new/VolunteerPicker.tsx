"use client";

import { IconSearch, IconX } from "@/components/forms/FormIcons";
import { INPUT_CLS } from "@/lib/formFieldClasses";
import { buildAvatarUrl, DEFAULT_AVATAR } from "@/lib/avatar";
import { TEAM_META } from "@/lib/seed/quests";
import type { SubquestVolunteerPickerRow } from "@/types/subquest";

const WAVE_COLORS = ["#F5C518", "#F97316", "#06B6D4", "#9333EA", "#22C55E"];

interface VolunteerPickerProps {
  selectedVolunteers: SubquestVolunteerPickerRow[];
  toggleVolunteer: (v: SubquestVolunteerPickerRow) => void;
  volunteerSearch: string;
  setVolunteerSearch: (v: string) => void;
  loadingVolunteers: boolean;
  filteredVolunteers: SubquestVolunteerPickerRow[];
  chapterVolunteers: SubquestVolunteerPickerRow[];
  error?: string;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

export function VolunteerPicker({
  selectedVolunteers,
  toggleVolunteer,
  volunteerSearch,
  setVolunteerSearch,
  loadingVolunteers,
  filteredVolunteers,
  chapterVolunteers,
  error,
  setErrors,
}: VolunteerPickerProps) {
  return (
    <div className="animate-fade-up" style={{ animationDuration: "180ms" }}>
      <label className="block text-[11px] font-sans uppercase tracking-widest text-text-secondary mb-2">
        Who gets assigned? *
      </label>

      {selectedVolunteers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {selectedVolunteers.map((v) => (
            <div
              key={v.uid}
              className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full border border-[#27272A] bg-[#16213e] text-xs text-text-secondary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buildAvatarUrl(v.username, v.avatarOptions ?? DEFAULT_AVATAR)}
                alt={v.username}
                className="w-5 h-5 rounded-full"
              />
              <span className="font-sans">{v.username}</span>
              <button
                type="button"
                onClick={() => toggleVolunteer(v)}
                className="text-text-muted hover:text-text-primary transition-colors ml-0.5"
              >
                <IconX />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="relative mb-2">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <IconSearch />
        </span>
        <input
          className={`${INPUT_CLS} pl-9`}
          placeholder="Search by username..."
          value={volunteerSearch}
          onChange={(e) => setVolunteerSearch(e.target.value)}
        />
      </div>

      {loadingVolunteers ? (
        <div className="flex items-center gap-2 py-3">
          {WAVE_COLORS.map((color, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: color,
                animation: "wave-dot 0.6s ease-in-out infinite",
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      ) : filteredVolunteers.length === 0 ? (
        <p className="text-text-muted text-xs py-2">
          {volunteerSearch
            ? "No one matches that search."
            : chapterVolunteers.length === 0
              ? "No volunteers in your chapter yet."
              : "Everyone's on the list."}
        </p>
      ) : (
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto scrollbar-minimal pr-1">
          {filteredVolunteers.map((v) => (
            <button
              key={v.uid}
              type="button"
              onClick={() => {
                toggleVolunteer(v);
                setErrors((p) => ({ ...p, assignees: "" }));
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#ffffff08] transition-colors text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={buildAvatarUrl(v.username, v.avatarOptions ?? DEFAULT_AVATAR)}
                alt={v.username}
                className="w-7 h-7 rounded-full shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary font-sans truncate">{v.username}</p>
                {v.teams.length > 0 && (
                  <p className="text-xs text-text-muted truncate">
                    {v.teams.map((t) => TEAM_META[t]?.label ?? t).join(", ")}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
