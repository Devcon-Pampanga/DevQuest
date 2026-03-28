import type { EventDoc } from "@/lib/events/types";
import { IconCalendar, IconPin } from "./EventDetailIcons";

interface EventHeaderCardProps {
  event: EventDoc;
  upcoming: boolean;
  totalFilled: number;
  totalSlots: number;
  timeLabel: string;
  formatDate: (d: import("firebase/firestore").Timestamp) => string;
}

export function EventHeaderCard({
  event,
  upcoming,
  totalFilled,
  totalSlots,
  timeLabel,
  formatDate,
}: EventHeaderCardProps) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="relative h-52 w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.bannerUrl ?? "/event-banner-placeholder.png"}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {!event.bannerUrl && (
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: upcoming
                ? "linear-gradient(135deg, #7C3AED, #A855F7)"
                : "rgba(39,39,42,0.8)",
            }}
          />
        )}
      </div>
      <div className="p-6 flex flex-col gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              upcoming
                ? "bg-accent-primary/20 text-accent-highlight"
                : "bg-zinc-700/40 text-zinc-400"
            }`}
          >
            {upcoming ? "UPCOMING" : "PAST"}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-text-muted font-medium">
            {event.chapterId}
          </span>
          {event.isInternal && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-text-muted font-medium">
              Internal
            </span>
          )}
          {event.lumaUrl && (
            <a
              href={event.lumaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-0.5 rounded-full border border-border text-text-secondary hover:text-text-primary hover:border-text-muted transition-colors"
            >
              View on Luma ↗
            </a>
          )}
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl text-text-primary leading-tight">
          {event.name}
        </h1>

        <div>
          <div className="flex items-center justify-between text-xs text-text-muted mb-1.5">
            <span>
              {totalFilled} / {totalSlots} spots filled
            </span>
            {totalSlots > 0 && totalFilled >= totalSlots && (
              <span className="text-red-400 font-medium">Full</span>
            )}
          </div>
          <div className="h-2 rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent-highlight transition-all"
              style={{ width: totalSlots > 0 ? `${Math.min(100, (totalFilled / totalSlots) * 100)}%` : "0%" }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 mt-1 text-text-secondary text-sm">
          <div className="flex items-center gap-2">
            <IconCalendar />
            <span>
              {formatDate(event.date)} · {timeLabel}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <IconPin />
            <span>{event.location}</span>
          </div>
        </div>
      </div>

      {event.description && (
        <div className="px-6 pb-6 border-t border-border pt-4">
          <p className="text-text-secondary text-sm leading-relaxed">{event.description}</p>
        </div>
      )}
    </div>
  );
}
