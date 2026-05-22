"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { User as FirebaseUser } from "firebase/auth";
import { isoToDateInput, isoToTimeInput } from "@/lib/eventDateInputs";
import {
  INTERNAL_EVENT_TYPES,
  DEFAULT_ROLES,
  buildRolesFromPreset,
  type EventScale,
  type RoleEntry,
} from "@/lib/eventNewConstants";
import { submitNewEvent } from "@/lib/eventCreate";
import type { ChapterSessionUser } from "@/types/chapter";

export function useNewEventForm({
  userData,
  firebaseUser,
}: {
  userData: ChapterSessionUser;
  firebaseUser: FirebaseUser;
}) {
  const router = useRouter();

  // Luma import
  const [lumaExpanded, setLumaExpanded] = useState(false);
  const [lumaUrl, setLumaUrl] = useState("");
  const [lumaLoading, setLumaLoading] = useState(false);
  const [lumaError, setLumaError] = useState("");
  const [lumaSuccess, setLumaSuccess] = useState(false);

  // Form fields
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [lumaLink, setLumaLink] = useState("");

  // Banner
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");

  // Roles
  const [roles, setRoles] = useState<RoleEntry[]>([]);

  // Scale + preset system
  const [eventScale, setEventScale] = useState("");
  const hasCustomRoles = useRef(false);
  const [presetPending, setPresetPending] = useState<{ type: string; scale: EventScale } | null>(null);

  // Add role dropdown
  const [showAddRole, setShowAddRole] = useState(false);

  // Internal event
  const [isInternal, setIsInternal] = useState(false);
  const [attendeeSlots, setAttendeeSlots] = useState(30);
  const [attendeeXP, setAttendeeXP] = useState(35);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successInfo, setSuccessInfo] = useState<{ eventId: string; eventName: string } | null>(null);

  async function handleLumaFetch() {
    if (!lumaUrl.trim()) return;
    setLumaLoading(true);
    setLumaError("");
    setLumaSuccess(false);

    try {
      const res = await fetch(`/api/luma?url=${encodeURIComponent(lumaUrl.trim())}`);
      const json = await res.json();

      if (!res.ok) { setLumaError(json.error || "Failed to fetch event details."); return; }

      if (json.name)        setEventName(json.name);
      if (json.description) setDescription(json.description);
      if (json.startDate) {
        setEventDate(isoToDateInput(json.startDate));
        setStartTime(isoToTimeInput(json.startDate));
      }
      if (json.endDate)  setEndTime(isoToTimeInput(json.endDate));
      if (json.location) setLocation(json.location);
      setLumaLink(lumaUrl.trim());
      setLumaSuccess(true);
    } catch {
      setLumaError("Could not reach the server. Try again.");
    } finally {
      setLumaLoading(false);
    }
  }

  function applyPreset(type: string, scale: EventScale) {
    setRoles(buildRolesFromPreset(type, scale));
    hasCustomRoles.current = false;
    setPresetPending(null);
    setShowAddRole(false);
  }

  function triggerPreset(type: string, scale: string) {
    if (!type || !scale) return;
    const s = scale as EventScale;
    if (hasCustomRoles.current) {
      setPresetPending({ type, scale: s });
    } else {
      applyPreset(type, s);
    }
  }

  function handleEventTypeChange(newType: string) {
    setEventType(newType);
    setIsInternal(INTERNAL_EVENT_TYPES.has(newType));
    triggerPreset(newType, eventScale);
  }

  function handleEventScaleChange(newScale: string) {
    setEventScale(newScale);
    triggerPreset(eventType, newScale);
  }

  function adjustSlots(id: string, delta: number) {
    hasCustomRoles.current = true;
    setPresetPending(null);
    setRoles((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, slots: Math.max(1, r.slots + delta) } : r
      )
    );
  }

  function removeRole(id: string) {
    hasCustomRoles.current = true;
    setPresetPending(null);
    setRoles((prev) => prev.filter((r) => r.id !== id));
  }

  function addRole(roleId: string) {
    const template = DEFAULT_ROLES.find((r: RoleEntry) => r.id === roleId);
    if (!template) return;
    hasCustomRoles.current = true;
    setPresetPending(null);
    setRoles((prev) => [...prev, { ...template, slots: 3 }]);
    setShowAddRole(false);
  }

  function handleBannerFile(file: File) {
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  }

  function handleBannerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    handleBannerFile(file);
  }

  function handleBannerDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) return;
    handleBannerFile(file);
  }

  function removeBanner() {
    setBannerFile(null);
    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    setBannerPreview("");
  }

  async function handleSubmit() {
    const errors: Record<string, string> = {};
    if (!eventName.trim()) errors.name = "Event name is required.";
    if (!eventType) errors.eventType = "Event type is required.";
    if (!eventDate) errors.date = "Date is required.";
    if (!location.trim()) errors.location = "Location is required.";
    if (!isInternal && roles.length === 0) errors.roles = "At least one volunteer role is required.";
    if (isInternal && attendeeSlots < 1) errors.roles = "At least 1 attendee seat is required.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitError("");

    const handleSetSuccessInfo = (v: { eventId: string; eventName: string } | null) => {
      if (!v) return;
      if (window.innerWidth < 768) {
        setSuccessInfo(v);
      } else {
        router.push(`/events/${v.eventId}`);
      }
    };

    await submitNewEvent({
      router,
      chapterId: userData.chapterId,
      uid: firebaseUser.uid,
      eventName,
      eventType,
      description,
      eventDate,
      startTime,
      endTime,
      location,
      lumaLink,
      bannerFile,
      isInternal,
      attendeeSlots,
      attendeeXP,
      roles,
      setSuccessInfo: handleSetSuccessInfo,
      setSubmitError,
      setSubmitting,
    });
  }

  return {
    // Luma
    lumaExpanded, setLumaExpanded,
    lumaUrl, setLumaUrl,
    lumaLoading,
    lumaError, setLumaError,
    lumaSuccess,
    setLumaSuccess,
    handleLumaFetch,
    // Form fields
    eventName, setEventName,
    eventType,
    description, setDescription,
    eventDate, setEventDate,
    startTime, setStartTime,
    endTime, setEndTime,
    location, setLocation,
    lumaLink, setLumaLink,
    handleEventTypeChange,
    handleEventScaleChange,
    // Banner
    bannerFile,
    bannerPreview,
    handleBannerChange,
    handleBannerDrop,
    removeBanner,
    // Roles
    roles,
    eventScale,
    presetPending, setPresetPending,
    showAddRole, setShowAddRole,
    applyPreset,
    adjustSlots,
    removeRole,
    addRole,
    // Internal event
    isInternal, setIsInternal,
    attendeeSlots, setAttendeeSlots,
    attendeeXP, setAttendeeXP,
    // Submit
    submitting,
    submitError,
    fieldErrors,
    successInfo,
    handleSubmit,
  };
}
