import { Quest } from "@/types/quest";

export const QUESTS: Quest[] = [
  // ─── Lead Learners ────────────────────────────────────────────────────────────
  // Associate tier (3 quests)

  {
    questId: "ll_as_1",
    teamId: "lead_learners",
    tier: "associate",
    name: "Attend a 2-Day LL Workshop",
    description:
      "Participate in both days of the Lead Learner Workshop to build foundational facilitation knowledge and get oriented with the program.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Lead Learner Workshop",
  },
  {
    questId: "ll_as_2",
    teamId: "lead_learners",
    tier: "associate",
    name: "Complete Specialized Code Camp Training",
    description:
      "Attend a Code Camp as a trainee or shadowing member to observe facilitation techniques and understand event-day operations first-hand.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Code Camp",
  },
  {
    questId: "ll_as_3",
    teamId: "lead_learners",
    tier: "associate",
    name: "Submit the LL Candidate Application Form",
    description:
      "Fill out and submit the Lead Learner Candidate Application Form to formally express your intent to join the facilitation team.",
    xpReward: 20,
    completionMethod: "self_mark",
  },

  // Specialist tier (2 quests — sequential, same trigger)

  {
    questId: "ll_sp_1",
    teamId: "lead_learners",
    tier: "specialist",
    name: "Facilitate Code Camp #1",
    description:
      "Lead your first Code Camp session as a facilitator, managing the class from start to finish under the guidance of a senior Lead Learner.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Code Camp",
    triggerRole: "Facilitator",
  },
  {
    questId: "ll_sp_2",
    teamId: "lead_learners",
    tier: "specialist",
    name: "Facilitate Code Camp #2",
    description:
      "Lead your second Code Camp session independently as the primary facilitator, demonstrating improved confidence and classroom management.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Code Camp",
    triggerRole: "Facilitator",
  },

  // Lead (Certified Lead Learner) tier (3 quests)

  {
    questId: "ll_ld_1",
    teamId: "lead_learners",
    tier: "lead",
    name: "Assist as Assistant LL — 2 Sessions",
    description:
      "Serve as an Assistant Lead Learner across two separate Code Camp sessions, mentoring new Associates and supporting the lead facilitator.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "ll_ld_2",
    teamId: "lead_learners",
    tier: "lead",
    name: "Complete 15-min Live Teaching Demo",
    description:
      "Deliver a 15-minute live teaching demonstration to DEVCON Kids officers, showcasing full facilitation readiness and subject mastery.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "ll_ld_3",
    teamId: "lead_learners",
    tier: "lead",
    name: "Pass the Official Certification Rubric",
    description:
      "Complete the Lead Learner Certification Rubric assessment with DEVCON Kids officers, meeting the required competency scores to earn your certification.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },

  // ─── People & Culture ─────────────────────────────────────────────────────────
  // Associate tier (1 quest)

  {
    questId: "pc_as_1",
    teamId: "people_culture",
    tier: "associate",
    name: "Invite 5 New Volunteers",
    description:
      "Recruit and onboard at least 5 new volunteers to DEVCON Kids, tracked via unique referral or the DevQuest onboarding flow.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  // Specialist tier (1 quest)

  {
    questId: "pc_sp_1",
    teamId: "people_culture",
    tier: "specialist",
    name: "Organize 1 Internal Community-Building Event",
    description:
      "Plan and run an internal social or team-building event (e.g., Team Dinner, Cabalen Meetup, or online social) to strengthen chapter bonds.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  // Lead (P&C Lead) tier (3 quests)

  {
    questId: "pc_ld_1",
    teamId: "people_culture",
    tier: "lead",
    name: "Mentor Junior Team Members",
    description:
      "Guide and support junior P&C members through their milestone quests, providing regular check-ins, feedback, and encouragement.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "pc_ld_2",
    teamId: "people_culture",
    tier: "lead",
    name: "Conduct Wellness Check-ins",
    description:
      "Carry out structured wellness check-ins with active volunteers across the chapter to monitor engagement, burnout risk, and overall morale.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },
  {
    questId: "pc_ld_3",
    teamId: "people_culture",
    tier: "lead",
    name: "Generate Chapter Engagement Reports",
    description:
      "Produce a comprehensive volunteer engagement report for the chapter, covering participation metrics, retention insights, and recommendations.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },

  // ─── Creatives ────────────────────────────────────────────────────────────────
  // Associate tier (1 quest)

  {
    questId: "cr_as_1",
    teamId: "creatives",
    tier: "associate",
    name: "Produce 5 Publicity Materials",
    description:
      "Design and deliver at least 5 graphics or social media posts promoting chapter events, following DEVCON Kids brand guidelines.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  // Specialist tier (1 quest)

  {
    questId: "cr_sp_1",
    teamId: "creatives",
    tier: "specialist",
    name: "Produce 1 Official Event Video",
    description:
      "Create a polished teaser or recap video for an official DEVCON Kids event, suitable for publishing on chapter social media channels.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },

  // Lead (Creative Director) tier (2 quests)

  {
    questId: "cr_ld_1",
    teamId: "creatives",
    tier: "lead",
    name: "Set Visual Direction for a Major Event",
    description:
      "Own the end-to-end visual identity for a major DEVCON Kids event — from initial brief to the final delivery of all design assets.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "cr_ld_2",
    teamId: "creatives",
    tier: "lead",
    name: "Review and Approve Designs",
    description:
      "Serve as the final approver for design outputs from Associates and Specialists, providing structured feedback and ensuring brand consistency.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },

  // ─── Sustainability ───────────────────────────────────────────────────────────
  // Associate tier (1 quest)

  {
    questId: "su_as_1",
    teamId: "sustainability",
    tier: "associate",
    name: "Send 5 Fundraising/Sponsorship Letters",
    description:
      "Draft and send at least 5 formal fundraising or sponsorship outreach letters to potential partners or donors on behalf of the chapter.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  // Specialist tier (1 quest)

  {
    questId: "su_sp_1",
    teamId: "sustainability",
    tier: "specialist",
    name: "Complete 5 Grant Applications",
    description:
      "Research, write, and submit at least 5 grant applications targeting funding bodies that support youth tech education or community programs.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },

  // Lead (Sustainability Lead) tier (2 quests)

  {
    questId: "su_ld_1",
    teamId: "sustainability",
    tier: "lead",
    name: "Produce the Annual Finance Report",
    description:
      "Compile and publish the chapter's annual finance report, documenting all income, expenses, sponsorships, and budget variances for the year.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "su_ld_2",
    teamId: "sustainability",
    tier: "lead",
    name: "Draft the Annual Program Budget",
    description:
      "Collaborate with chapter directors to draft a comprehensive annual program budget, projecting costs for events, materials, and operations.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },

  // ─── Community Engagement ─────────────────────────────────────────────────────
  // Associate tier (1 quest)

  {
    questId: "ce_as_1",
    teamId: "community_engagement",
    tier: "associate",
    name: "Document and Create Content for 5 Events",
    description:
      "Attend and document at least 5 separate chapter events, producing written, photo, or social media content that captures each event's impact.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  // Specialist tier (2 quests — different triggerEventType, not sequential)

  {
    questId: "ce_sp_1",
    teamId: "community_engagement",
    tier: "specialist",
    name: "Represent at External Tech Event #1",
    description:
      "Attend and officially represent DEVCON Kids at an external community workshop, networking with attendees and promoting the chapter's programs.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "External Workshop",
  },
  {
    questId: "ce_sp_2",
    teamId: "community_engagement",
    tier: "specialist",
    name: "Represent at External Tech Event #2",
    description:
      "Attend and officially represent DEVCON Kids at a technology summit or conference, engaging with industry stakeholders and expanding the chapter's network.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Tech Summit",
  },

  // Lead (CE Lead) tier (2 quests)

  {
    questId: "ce_ld_1",
    teamId: "community_engagement",
    tier: "lead",
    name: "Initiate Partnership Outreach",
    description:
      "Proactively reach out to external organizations, schools, or communities to explore collaboration opportunities that expand DEVCON Kids' presence.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "ce_ld_2",
    teamId: "community_engagement",
    tier: "lead",
    name: "Develop Synergies with New Partner Organizations",
    description:
      "Formalize and deepen relationships with at least two new partner organizations, co-creating events or initiatives that benefit both communities.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const TIER_ORDER: Quest["tier"][] = [
  "team_member",
  "associate",
  "specialist",
  "lead",
];

export const TIER_LABELS: Record<Quest["tier"], string> = {
  team_member: "Team Member",
  associate: "Associate",
  specialist: "Specialist",
  lead: "Lead",
};

export const TEAM_META: Record<
  string,
  { label: string; color: string; leadTitle: string }
> = {
  lead_learners: {
    label: "Lead Learners",
    color: "#F5C518",
    leadTitle: "Certified Lead Learner",
  },
  people_culture: {
    label: "People & Culture",
    color: "#F97316",
    leadTitle: "P&C Lead",
  },
  creatives: {
    label: "Creatives",
    color: "#9333EA",
    leadTitle: "Creative Director",
  },
  sustainability: {
    label: "Sustainability",
    color: "#22C55E",
    leadTitle: "Sustainability Lead",
  },
  community_engagement: {
    label: "Community Engagement",
    color: "#06B6D4",
    leadTitle: "CE Lead",
  },
};

export function getQuestsForTeam(teamId: string): Quest[] {
  return QUESTS.filter((q) => q.teamId === teamId);
}

export function getQuestsForTier(teamId: string, tier: Quest["tier"]): Quest[] {
  return QUESTS.filter((q) => q.teamId === teamId && q.tier === tier);
}
