export interface VolunteerResumeTeamRow {
  teamLabel: string;
  earnedTierLabel: string;
}

export interface VolunteerResumeQuestLine {
  name: string;
  coordinatorVerified: boolean;
}

export interface VolunteerResumeEarnedBadge {
  name: string;
  image: string;
}

export interface VolunteerResumeEventContribution {
  name: string;
  dateLabel: string;
  paragraph: string;
}

export interface VolunteerResumeInput {
  displayName: string;
  chapterId: string;
  totalXp: number;
  role: "volunteer" | "coordinator";
  joinedAtLabel?: string;
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
  earnedBadges: VolunteerResumeEarnedBadge[];
  eventContributions: VolunteerResumeEventContribution[];
  fileBaseName: string;
  aiProfessionalSummary?: string | null;
  aiSkills?: string[];
  aiInvolvementBullets?: string[];
}
