"use client";

import Link from "next/link";
import type { User as FirebaseUser } from "firebase/auth";
import type { EventDoc, EventRegistration, EventRole, PublicRegistrationRow } from "@/lib/events/types";
import { DEFAULT_AVATAR, buildAvatarUrl } from "@/lib/avatar";
import { IconBack, IconCheck } from "./EventDetailIcons";
import { RoleModal } from "./EventDetailModals";
import { EventHeaderCard } from "./EventHeaderCard";
import { EventRolesSection } from "./EventRolesSection";

interface VolunteerEventDetailProps {
  event: EventDoc;
  eventId: string;
  slotCounts: Record<string, number>;
  myReg: EventRegistration | null;
  publicRegs: PublicRegistrationRow[];
  firebaseUser: FirebaseUser | null;
  avatarUrl: string;
  upcoming: boolean;
  totalSlots: number;
  totalFilled: number;
  timeLabel: string;
  formatDate: (ts: import("firebase/firestore").Timestamp) => string;
  joined: boolean;
  attended: boolean;
  reflectionSubmitted: boolean;
  reflectionOpen: boolean;
  hoursLeft: number;
  showRoleModal: boolean;
  setShowRoleModal: (v: boolean) => void;
  joiningLoading: boolean;
  onJoin: (role: EventRole) => void;
}

export function VolunteerEventDetail({
  event,
  eventId,
  slotCounts,
  myReg,
  publicRegs,
  firebaseUser,
  avatarUrl,
  upcoming,
  totalSlots,
  totalFilled,
  timeLabel,
  formatDate,
  joined,
  attended,
  reflectionSubmitted,
  reflectionOpen,
  hoursLeft,
  showRoleModal,
  setShowRoleModal,
  joiningLoading,
  onJoin,
}: VolunteerEventDetailProps) {
  return (
    <div className="flex flex-col min-h-screen pb-24">
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-border bg-base">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/events" className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
            <IconBack />
          </Link>
          <h1 className="font-heading text-xl text-text-primary tracking-wide truncate min-w-0">{event.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="Profile" width={36} height={36} className="rounded-xl border-2 border-border hover:border-accent-highlight transition-colors" />
          </Link>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col gap-5">
          <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
            <EventHeaderCard
              event={event}
              upcoming={upcoming}
              totalFilled={totalFilled}
              totalSlots={totalSlots}
              timeLabel={timeLabel}
              formatDate={formatDate}
            />
          </div>

          {joined && myReg && (
            <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 border border-green-500/25 rounded-xl animate-fade-up" style={{ animationDelay: "60ms" }}>
              <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <IconCheck />
              </span>
              <p className="text-sm text-green-400">
                You&rsquo;re registered as <strong>{myReg.role}</strong> · +{myReg.roleXP} XP on attendance
              </p>
            </div>
          )}

          {reflectionOpen && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-orange-500/10 border border-orange-500/25 rounded-xl animate-fade-up" style={{ animationDelay: "120ms" }}>
              <p className="text-sm text-orange-400">
                Submit your reflection — due in <strong>{hoursLeft}h</strong>
              </p>
              <Link
                href={`/events/${eventId}/reflect`}
                className="shrink-0 text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-400 rounded-lg text-white font-heading transition-colors"
              >
                Submit Now
              </Link>
            </div>
          )}
          {attended && reflectionSubmitted && (
            <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/25 rounded-xl animate-fade-up" style={{ animationDelay: "120ms" }}>
              <IconCheck />
              <p className="text-sm text-green-400">Reflection submitted ✓</p>
            </div>
          )}
          {!upcoming && !attended && (
            <div className="px-4 py-3 bg-surface border border-border rounded-xl text-sm text-text-muted animate-fade-up" style={{ animationDelay: "120ms" }}>
              This event has passed.
            </div>
          )}

          <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
            <EventRolesSection event={event} slotCounts={slotCounts} />
          </div>

          {joined && myReg?.qrData && (
            <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center gap-4 animate-fade-up" style={{ animationDelay: "180ms" }}>
              <div>
                <h3 className="font-heading text-base text-text-primary text-center mb-1">Your QR Code</h3>
                <p className="text-xs text-text-muted text-center">Show this to your coordinator on the day of the event</p>
              </div>
              <div className="bg-white p-3 rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(myReg.qrData)}&size=280x280&margin=4`}
                  alt="Your attendance QR code"
                  width={280}
                  height={280}
                  className="rounded-lg"
                />
              </div>
              <p className="text-xs text-text-muted text-center">Show this to your coordinator on the day of the event.</p>
            </div>
          )}

          {joined && publicRegs.length > 0 && (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden animate-fade-up" style={{ animationDelay: "240ms" }}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="font-heading text-base text-text-primary">{event.isInternal ? "Fellow Attendees" : "Who's Joining"}</h3>
                <span className="text-xs text-text-muted font-sans">{publicRegs.length} registered</span>
              </div>
              <div className="flex flex-col">
                {publicRegs.map((reg, idx) => {
                  const isMe = reg.userId === firebaseUser?.uid;
                  return (
                    <div
                      key={reg.userId}
                      className={`flex items-center gap-3 px-5 py-3.5 ${idx < publicRegs.length - 1 ? "border-b border-border" : ""} ${isMe ? "bg-accent-primary/5" : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={buildAvatarUrl(reg.username, reg.avatarOptions ?? DEFAULT_AVATAR)}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-lg border border-border shrink-0"
                      />
                      <span className="flex-1 text-sm text-text-primary font-medium truncate">
                        {reg.username}
                        {isMe && <span className="text-text-muted font-normal"> (You)</span>}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-accent-primary/20 text-accent-highlight font-medium shrink-0">{reg.role}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {upcoming && !joined && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-56 p-4 bg-gradient-to-t from-base via-base/95 to-transparent">
          <div className="max-w-3xl lg:max-w-5xl mx-auto">
            <button
              type="button"
              onClick={() => (event.isInternal ? onJoin(event.roles[0]) : setShowRoleModal(true))}
              disabled={joiningLoading}
              className="w-full py-4 bg-accent-highlight hover:bg-accent-primary disabled:opacity-60 disabled:cursor-not-allowed rounded-2xl text-white font-heading font-medium text-base transition-colors shadow-lg shadow-accent-primary/25"
            >
              {joiningLoading ? "Joining..." : event.isInternal ? "Join as Attendee" : "Join Event"}
            </button>
          </div>
        </div>
      )}

      {showRoleModal && !event.isInternal && (
        <RoleModal
          roles={event.roles}
          slotCounts={slotCounts}
          onConfirm={onJoin}
          onClose={() => setShowRoleModal(false)}
          loading={joiningLoading}
        />
      )}
    </div>
  );
}
