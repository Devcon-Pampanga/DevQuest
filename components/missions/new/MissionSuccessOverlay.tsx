"use client";

import type { MissionAssignmentType, MissionDifficulty } from "@/types/mission";
import { DIFFICULTY_META } from "@/types/mission";

export function MissionSuccessOverlay({
  difficulty,
  successInfo,
}: {
  difficulty: MissionDifficulty;
  successInfo: { count: number; type: MissionAssignmentType };
}) {
  const sc = DIFFICULTY_META[difficulty].color;
  const msg =
    successInfo.type === "open"
      ? "Your chapter can now claim a spot."
      : successInfo.count === 0
        ? "Subquest is live."
        : `${successInfo.count} volunteer${successInfo.count !== 1 ? "s" : ""} ${successInfo.count !== 1 ? "have" : "has"} been assigned.`;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base"
      style={{ animation: "successFadeIn 0.35s ease-out forwards" }}
    >
      <style>{`
          @keyframes successFadeIn {
            from { opacity: 0; transform: scale(0.97); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes circleDraw {
            from { stroke-dashoffset: 166; }
            to   { stroke-dashoffset: 0; }
          }
          @keyframes checkDraw {
            from { stroke-dashoffset: 48; }
            to   { stroke-dashoffset: 0; }
          }
          .draw-circle {
            stroke-dasharray: 166;
            stroke-dashoffset: 166;
            animation: circleDraw 0.55s ease-out 0.15s forwards;
          }
          .draw-check {
            stroke-dasharray: 48;
            stroke-dashoffset: 48;
            animation: checkDraw 0.3s ease-out 0.65s forwards;
          }
        `}</style>

      <svg viewBox="0 0 52 52" className="w-20 h-20 mb-8" style={{ overflow: "visible" }}>
        <circle
          cx="26"
          cy="26"
          r="25"
          fill="none"
          stroke={sc}
          strokeWidth="1.5"
          className="draw-circle"
        />
        <path
          fill="none"
          stroke={sc}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 27l8 8 16-16"
          className="draw-check"
        />
      </svg>

      <h2 className="font-heading text-3xl text-text-primary mb-3 tracking-wide">Subquest live.</h2>
      <p className="text-text-secondary text-sm text-center max-w-xs leading-relaxed">{msg}</p>
      <p className="text-text-muted text-xs mt-10">Heading to subquests…</p>
    </div>
  );
}
