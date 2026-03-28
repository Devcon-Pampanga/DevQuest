export const TEAMS = [
  { id: "lead_learners", name: "Lead Learners", color: "#F5C518" },
  { id: "people_culture", name: "People & Culture", color: "#F97316" },
  { id: "community_engagement", name: "Community Engagement", color: "#06B6D4" },
  { id: "creatives", name: "Creatives", color: "#9333EA" },
  { id: "sustainability", name: "Sustainability", color: "#22C55E" },
] as const;

export const CHAPTERS = [
  "DEVCON Kids Baguio",
  "DEVCON Kids Cagayan de Oro",
  "DEVCON Kids Cebu",
  "DEVCON Kids Davao",
  "DEVCON Kids Iloilo",
  "DEVCON Kids Manila",
  "DEVCON Kids Pampanga",
  "DEVCON Kids Quezon City",
  "DEVCON Kids Tacloban",
  "DEVCON Kids Zamboanga",
] as const;

export const TEAM_INFO = [
  {
    id: "lead_learners",
    name: "Lead Learners",
    color: "#F5C518",
    description:
      "The largest of the volunteer teams. They deliver the learning experiences central to the DEVCON Kids program.",
    tiers: ["Team Member", "Lead Learner Associate", "Lead Learner Specialist", "Certified Lead Learner"],
  },
  {
    id: "people_culture",
    name: "People & Culture",
    color: "#F97316",
    description: "Works to recruit volunteers and keep volunteer engagement high across all chapters.",
    tiers: ["Team Member", "Associate", "Specialist", "P&C Lead"],
  },
  {
    id: "community_engagement",
    name: "Community Engagement",
    color: "#06B6D4",
    description:
      "Builds relationships, partnerships, and synergies with other organizations to grow DEVCON Kids' reach.",
    tiers: ["Team Member", "Representative Associate", "Ambassador Specialist", "CE Lead"],
  },
  {
    id: "creatives",
    name: "Creatives",
    color: "#9333EA",
    description: "Produces artwork, visual content, and creative materials to support DEVCON Kids events.",
    tiers: ["Team Member", "Associate", "Specialist", "Creative Director"],
  },
  {
    id: "sustainability",
    name: "Sustainability",
    color: "#22C55E",
    description:
      "Works towards critical resource management and financial sustainability of the DEVCON Kids program.",
    tiers: ["Team Member", "Sustainability Associate", "Sustainability Specialist", "Sustainability Lead"],
  },
] as const;
