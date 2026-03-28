export interface VolunteerResumeTeamRow {
  teamLabel: string;
  earnedTierLabel: string;
}

export interface VolunteerResumeQuestLine {
  name: string;
  coordinatorVerified: boolean;
}

export interface VolunteerResumeActivityLine {
  description: string;
  dateLabel: string;
}

export interface VolunteerResumeInput {
  displayName: string;
  chapterId: string;
  totalXp: number;
  role: "volunteer" | "coordinator";
  linkedinUrl?: string;
  githubUrl?: string;
  teams: VolunteerResumeTeamRow[];
  completedQuests: VolunteerResumeQuestLine[];
  impact: {
    eventsAttended: number;
    reflections: number;
    questsCompleted: number;
    badgesEarned: number;
  };
  earnedBadgeNames: string[];
  recentActivity: VolunteerResumeActivityLine[];
  fileBaseName: string;
  aiProfessionalSummary?: string | null;
  aiSkills?: string[];
  aiInvolvementBullets?: string[];
}
