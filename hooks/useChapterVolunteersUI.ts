"use client";

import { useState, useEffect, useMemo } from "react";
import type { ChapterVolunteer } from "@/types/chapter";

const VOLUNTEER_PAGE_SIZE = 8;

export function useChapterVolunteersUI(
  volunteers: ChapterVolunteer[],
  viewingChapterId: string
) {
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [volunteerPage, setVolunteerPage] = useState(1);

  useEffect(() => {
    setSearch("");
    setTeamFilter("all");
  }, [viewingChapterId]);

  const sortedVolunteers = useMemo(() => {
    return [...volunteers].sort((a, b) => a.username.localeCompare(b.username));
  }, [volunteers]);

  const filteredVolunteers = useMemo(() => {
    return sortedVolunteers
      .filter((v) => v.username.toLowerCase().includes(search.toLowerCase()))
      .filter((v) => teamFilter === "all" || v.teams.includes(teamFilter));
  }, [sortedVolunteers, search, teamFilter]);

  const volunteerTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredVolunteers.length / VOLUNTEER_PAGE_SIZE));
  }, [filteredVolunteers.length]);

  const pagedVolunteers = useMemo(() => {
    const start = (volunteerPage - 1) * VOLUNTEER_PAGE_SIZE;
    return filteredVolunteers.slice(start, start + VOLUNTEER_PAGE_SIZE);
  }, [filteredVolunteers, volunteerPage]);

  useEffect(() => {
    setVolunteerPage(1);
  }, [search, teamFilter, viewingChapterId]);

  useEffect(() => {
    setVolunteerPage((p) => Math.min(Math.max(1, p), volunteerTotalPages));
  }, [volunteerTotalPages]);

  return {
    search,
    setSearch,
    teamFilter,
    setTeamFilter,
    volunteerPage,
    setVolunteerPage,
    VOLUNTEER_PAGE_SIZE,
    sortedVolunteers,
    filteredVolunteers,
    pagedVolunteers,
    volunteerTotalPages,
  };
}
