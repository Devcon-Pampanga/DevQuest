import { Quest } from "@/types/quest";

export const QUESTS: Quest[] = [
  // ─── Lead Learners ────────────────────────────────────────────────────────────

  {
    questId: "ll_tm_1",
    teamId: "lead_learners",
    tier: "team_member",
    name: "Attend a Lead Learner 2-Day Workshop",
    description:
      "Participate in both days of the Lead Learner workshop to build foundational facilitation knowledge and get oriented with the program.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Lead Learner Workshop",
  },
  {
    questId: "ll_tm_2",
    teamId: "lead_learners",
    tier: "team_member",
    name: "Complete Lead Learner Candidate Form",
    description:
      "Fill out and submit the Lead Learner Candidate Application Form to formally express your intent to join the team.",
    xpReward: 20,
    completionMethod: "self_mark",
  },
  {
    questId: "ll_tm_3",
    teamId: "lead_learners",
    tier: "team_member",
    name: "Pass the Basic Skills Knowledge Check",
    description:
      "Demonstrate foundational knowledge in your chosen coding specialization by completing the skills knowledge check with a coordinator.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  {
    questId: "ll_as_1",
    teamId: "lead_learners",
    tier: "associate",
    name: "Facilitate 1st Code Camp (Assist Lead)",
    description:
      "Serve as an assisting facilitator in your first code camp, supporting the lead facilitator and learning event-day operations.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Code Camp",
    triggerRole: "Facilitator",
  },
  {
    questId: "ll_as_2",
    teamId: "lead_learners",
    tier: "associate",
    name: "Shadow a Specialist during a Demo",
    description:
      "Observe a Specialist Lead Learner as they conduct a teaching demo, taking notes on technique, pacing, and student engagement.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Code Camp",
  },
  {
    questId: "ll_as_3",
    teamId: "lead_learners",
    tier: "associate",
    name: "Complete 1 Curriculum Review Session",
    description:
      "Participate in a structured curriculum review session with a DEVCON Kids officer or specialist to strengthen your lesson delivery.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  {
    questId: "ll_sp_1",
    teamId: "lead_learners",
    tier: "specialist",
    name: "Facilitate 2nd Code Camp (Primary Facilitator)",
    description:
      "Lead a code camp as the primary facilitator, independently managing the session from start to finish.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Code Camp",
    triggerRole: "Facilitator",
  },
  {
    questId: "ll_sp_2",
    teamId: "lead_learners",
    tier: "specialist",
    name: "Co-teach a Specialized Track",
    description:
      "Deliver a specialized coding track (e.g., Python, Web Dev, Scratch) in collaboration with another Lead Learner, demonstrating subject mastery.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },
  {
    questId: "ll_sp_3",
    teamId: "lead_learners",
    tier: "specialist",
    name: "Pass the Intermediate Facilitation Rubric",
    description:
      "Be evaluated by a DEVCON Kids officer using the Intermediate Facilitation Rubric and meet the required competency score.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  {
    questId: "ll_ld_1",
    teamId: "lead_learners",
    tier: "lead",
    name: "Complete 15-min Live Teaching Demo",
    description:
      "Deliver a 15-minute live teaching demonstration to DEVCON Kids officers in the audience, showcasing full facilitation readiness.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "ll_ld_2",
    teamId: "lead_learners",
    tier: "lead",
    name: "Mentor a New Associate Through Their 1st Camp",
    description:
      "Serve as a mentor to a new Lead Learner Associate during their first code camp, providing guidance and real-time support.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "ll_ld_3",
    teamId: "lead_learners",
    tier: "lead",
    name: "Pass Final Certification Rubric Assessment",
    description:
      "Complete the Lead Learner Certification Rubric assessment with DEVCON Kids officers and reflect on your scores together.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },

  // ─── People & Culture ─────────────────────────────────────────────────────────

  {
    questId: "pc_tm_1",
    teamId: "people_culture",
    tier: "team_member",
    name: "Assist in 1 Volunteer Orientation",
    description:
      "Help coordinate and facilitate a volunteer orientation session, welcoming new members to the DEVCON Kids community.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Volunteer Orientation",
  },
  {
    questId: "pc_tm_2",
    teamId: "people_culture",
    tier: "team_member",
    name: "Set up the Chapter Attendance System",
    description:
      "Configure and document the chapter's attendance tracking system (bot, spreadsheet, or tool) for use in upcoming events.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },
  {
    questId: "pc_tm_3",
    teamId: "people_culture",
    tier: "team_member",
    name: "Welcome 5 New Members in the Discord/GC",
    description:
      "Personally welcome at least 5 new volunteers to the chapter Discord or group chat, introducing them to key channels and resources.",
    xpReward: 20,
    completionMethod: "self_mark",
  },

  {
    questId: "pc_as_1",
    teamId: "people_culture",
    tier: "associate",
    name: "Organize a Volunteer Social Meetup",
    description:
      "Plan and run an informal social gathering (online or in-person) to build rapport and strengthen team bonds among volunteers.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },
  {
    questId: "pc_as_2",
    teamId: "people_culture",
    tier: "associate",
    name: "Track and Report Volunteer Hours for 1 Event",
    description:
      "Collect, compile, and submit a volunteer hours report for a single event, ensuring all hours are accurately documented.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },
  {
    questId: "pc_as_3",
    teamId: "people_culture",
    tier: "associate",
    name: "Conduct 3 Check-in Calls with Active Members",
    description:
      "Reach out to at least 3 active volunteers through individual check-in calls or messages to assess engagement and wellbeing.",
    xpReward: 20,
    completionMethod: "self_mark",
  },

  {
    questId: "pc_sp_1",
    teamId: "people_culture",
    tier: "specialist",
    name: "Lead a Recruitment Drive at a Local University",
    description:
      "Organize and execute a volunteer recruitment initiative at a local university, attracting new candidates to DEVCON Kids.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "pc_sp_2",
    teamId: "people_culture",
    tier: "specialist",
    name: "Solve 1 Internal Conflict or Logistics Bottleneck",
    description:
      "Identify and resolve a team conflict or operational bottleneck, documenting the issue and the steps taken to address it.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },
  {
    questId: "pc_sp_3",
    teamId: "people_culture",
    tier: "specialist",
    name: "Design a Volunteer of the Month Spotlight",
    description:
      "Create and publish a 'Volunteer of the Month' feature recognizing a standout contributor in the chapter community.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  {
    questId: "pc_ld_1",
    teamId: "people_culture",
    tier: "lead",
    name: "Draft the Chapter's Volunteer Retention Strategy",
    description:
      "Write a comprehensive retention strategy for the chapter covering engagement tactics, recognition programs, and feedback loops.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "pc_ld_2",
    teamId: "people_culture",
    tier: "lead",
    name: "Onboard a New Batch of 20+ Volunteers",
    description:
      "Lead the full onboarding process for a new cohort of 20 or more volunteers, from orientation to team assignment.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "pc_ld_3",
    teamId: "people_culture",
    tier: "lead",
    name: "Present an Engagement Report to National",
    description:
      "Prepare and deliver a volunteer engagement report to national DEVCON Kids officers, covering metrics, insights, and recommendations.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },

  // ─── Creatives ────────────────────────────────────────────────────────────────

  {
    questId: "cr_tm_1",
    teamId: "creatives",
    tier: "team_member",
    name: "Create 3 Social Media Save the Date Posts",
    description:
      "Design and submit three 'Save the Date' posts for upcoming DEVCON Kids events that follow brand guidelines.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },
  {
    questId: "cr_tm_2",
    teamId: "creatives",
    tier: "team_member",
    name: "Shoot Raw Footage or Photos for 1 Code Camp",
    description:
      "Capture raw photo or video documentation during a code camp for use in event recaps and chapter archives.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Code Camp",
  },
  {
    questId: "cr_tm_3",
    teamId: "creatives",
    tier: "team_member",
    name: "Assist in Setting Up the Event Photo Wall",
    description:
      "Help prepare and set up the physical or digital photo wall display at a DEVCON Kids event.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Code Camp",
  },

  {
    questId: "cr_as_1",
    teamId: "creatives",
    tier: "associate",
    name: "Edit a 1-Minute Event Recap Video",
    description:
      "Produce a polished 1-minute recap video from raw event footage, suitable for sharing on DEVCON Kids social channels.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },
  {
    questId: "cr_as_2",
    teamId: "creatives",
    tier: "associate",
    name: "Design a Set of Chapter-Specific Stickers",
    description:
      "Create a set of original, on-brand sticker designs unique to your chapter for use in events and merchandise.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },
  {
    questId: "cr_as_3",
    teamId: "creatives",
    tier: "associate",
    name: "Layout 1 Event Program or Poster",
    description:
      "Design the program booklet or promotional poster for a DEVCON Kids event following the visual identity guidelines.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  {
    questId: "cr_sp_1",
    teamId: "creatives",
    tier: "specialist",
    name: "Direct the Visual Branding for a Major Event",
    description:
      "Own the end-to-end visual identity for a major DEVCON Kids event — from brief to final delivery of all design assets.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "cr_sp_2",
    teamId: "creatives",
    tier: "specialist",
    name: "Manage the Chapter's Social Media for 1 Month",
    description:
      "Take ownership of all chapter social media content for one full month, including planning, posting, and engagement.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },
  {
    questId: "cr_sp_3",
    teamId: "creatives",
    tier: "specialist",
    name: "Create a Custom DevQuest UI Asset",
    description:
      "Design an original UI asset (icon set, illustration, or component graphic) for use within the DevQuest platform.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  {
    questId: "cr_ld_1",
    teamId: "creatives",
    tier: "lead",
    name: "Launch a Full Chapter Marketing Campaign",
    description:
      "Plan and execute a complete multi-channel marketing campaign for the chapter, covering social, print, and digital assets.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "cr_ld_2",
    teamId: "creatives",
    tier: "lead",
    name: "Mentor a Team of 3 Junior Creatives",
    description:
      "Guide three Creatives Associates through their milestone quests, providing feedback and creative direction throughout.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "cr_ld_3",
    teamId: "creatives",
    tier: "lead",
    name: "Finalize the Chapter Brand Identity Guide",
    description:
      "Produce a comprehensive brand identity guide for your chapter, documenting colors, typography, logo usage, and tone of voice.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },

  // ─── Sustainability ───────────────────────────────────────────────────────────

  {
    questId: "su_tm_1",
    teamId: "sustainability",
    tier: "team_member",
    name: "Inventory Check for 1 Code Camp Kit",
    description:
      "Conduct a full inventory check of supplies in a code camp kit, documenting all items and flagging anything missing or damaged.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Code Camp",
  },
  {
    questId: "su_tm_2",
    teamId: "sustainability",
    tier: "team_member",
    name: "Distribute Materials to 50+ Students",
    description:
      "Manage the distribution of snacks, kits, or learning materials to at least 50 students during a code camp.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Code Camp",
  },
  {
    questId: "su_tm_3",
    teamId: "sustainability",
    tier: "team_member",
    name: "Help Set Up or Tear Down the Event Venue",
    description:
      "Assist the logistics team in the full setup or teardown of the event venue, ensuring the space is ready or properly cleared.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Code Camp",
  },

  {
    questId: "su_as_1",
    teamId: "sustainability",
    tier: "associate",
    name: "Coordinate Transport for 10+ Volunteers",
    description:
      "Organize transportation logistics for at least 10 volunteers to and from a DEVCON Kids event, ensuring no one is left behind.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },
  {
    questId: "su_as_2",
    teamId: "sustainability",
    tier: "associate",
    name: "Procure 3 New Venue Options for Future Camps",
    description:
      "Research, visit (if possible), and document at least 3 viable venue options for future code camps with capacity and cost details.",
    xpReward: 20,
    completionMethod: "self_mark",
  },
  {
    questId: "su_as_3",
    teamId: "sustainability",
    tier: "associate",
    name: "Manage the Event Budget Sheet for 1 Month",
    description:
      "Own and maintain the chapter's event budget tracking sheet for one full month, keeping all entries accurate and up to date.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  {
    questId: "su_sp_1",
    teamId: "sustainability",
    tier: "specialist",
    name: "Secure 1 Local Food or Venue Sponsorship",
    description:
      "Identify, pitch, and close a sponsorship deal with a local food provider or venue for use at a DEVCON Kids event.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "su_sp_2",
    teamId: "sustainability",
    tier: "specialist",
    name: "Optimize the Chapter Resource Inventory",
    description:
      "Audit the current resource inventory, identify inefficiencies, and implement a new system or process to improve tracking and reuse.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },
  {
    questId: "su_sp_3",
    teamId: "sustainability",
    tier: "specialist",
    name: "Draft a Grant Proposal or Donation Letter",
    description:
      "Write a formal grant proposal or donation request letter targeting a potential sponsor or funding body for the chapter.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },

  {
    questId: "su_ld_1",
    teamId: "sustainability",
    tier: "lead",
    name: "Close a Major Financial or Venue Partnership",
    description:
      "Negotiate and finalize a significant financial or venue partnership that provides long-term value for the chapter's operations.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "su_ld_2",
    teamId: "sustainability",
    tier: "lead",
    name: "Oversee Logistics for a 100+ Student Event",
    description:
      "Serve as the lead logistics coordinator for a large-scale DEVCON Kids event with 100 or more student participants.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "su_ld_3",
    teamId: "sustainability",
    tier: "lead",
    name: "Draft a 1-Year Chapter Sustainability Plan",
    description:
      "Produce a comprehensive sustainability plan for the chapter covering budgeting, resource management, and partnership goals for the year ahead.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },

  // ─── Community Engagement ─────────────────────────────────────────────────────

  {
    questId: "ce_tm_1",
    teamId: "community_engagement",
    tier: "team_member",
    name: "Represent DEVCON Kids at 1 School Event",
    description:
      "Attend and represent DEVCON Kids at a local school event, sharing the program's mission and recruiting potential participants.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "School Event",
  },
  {
    questId: "ce_tm_2",
    teamId: "community_engagement",
    tier: "team_member",
    name: "Distribute 50 Flyers for an Upcoming Camp",
    description:
      "Personally distribute at least 50 physical or digital flyers promoting an upcoming DEVCON Kids code camp.",
    xpReward: 20,
    completionMethod: "self_mark",
  },
  {
    questId: "ce_tm_3",
    teamId: "community_engagement",
    tier: "team_member",
    name: "Document 3 Success Stories from Parents",
    description:
      "Gather and write up at least 3 testimonial stories from parents of students who participated in DEVCON Kids programs.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  {
    questId: "ce_as_1",
    teamId: "community_engagement",
    tier: "associate",
    name: "Facilitate a 1st Meeting with a Partner Org",
    description:
      "Set up and lead an initial exploratory meeting with a potential partner organization to discuss collaboration opportunities.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },
  {
    questId: "ce_as_2",
    teamId: "community_engagement",
    tier: "associate",
    name: "Act as Chapter Rep at 1 External Workshop",
    description:
      "Attend an external workshop or summit as the official DEVCON Kids chapter representative, networking and promoting the program.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "External Workshop",
  },
  {
    questId: "ce_as_3",
    teamId: "community_engagement",
    tier: "associate",
    name: "Draft 1 Partnership Invitation Letter",
    description:
      "Write a formal partnership invitation letter to a prospective organization, clearly articulating the mutual benefits of collaboration.",
    xpReward: 75,
    completionMethod: "coordinator_approval",
    approvalType: "standard",
  },

  {
    questId: "ce_sp_1",
    teamId: "community_engagement",
    tier: "specialist",
    name: "Negotiate 1 New Venue or Logistics Partnership",
    description:
      "Lead negotiations with a new venue or logistics provider, securing favorable terms for the chapter's upcoming events.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "ce_sp_2",
    teamId: "community_engagement",
    tier: "specialist",
    name: "Manage the Ambassador Booth at a Tech Summit",
    description:
      "Operate the DEVCON Kids ambassador booth at a technology summit, engaging attendees and collecting leads for new partnerships.",
    xpReward: 0,
    completionMethod: "qr_scan",
    triggerEventType: "Tech Summit",
  },
  {
    questId: "ce_sp_3",
    teamId: "community_engagement",
    tier: "specialist",
    name: "Onboard 2 New Community Partner Organizations",
    description:
      "Successfully bring two new organizations into the DEVCON Kids partner network, completing the onboarding process for each.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },

  {
    questId: "ce_ld_1",
    teamId: "community_engagement",
    tier: "lead",
    name: "Secure a Formal MOU/MOA with a Local Gov/LGU",
    description:
      "Negotiate and formalize a Memorandum of Understanding or Agreement with a local government unit or official body.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "ce_ld_2",
    teamId: "community_engagement",
    tier: "lead",
    name: "Lead the Chapter's Outreach Strategy for the Quarter",
    description:
      "Own and execute the chapter's full community outreach strategy for an entire quarter, setting goals and reporting outcomes.",
    xpReward: 150,
    completionMethod: "coordinator_approval",
    approvalType: "major",
  },
  {
    questId: "ce_ld_3",
    teamId: "community_engagement",
    tier: "lead",
    name: "Organize a Multi-Org Tech Synergy Event",
    description:
      "Conceptualize, plan, and execute a collaborative event bringing together multiple organizations for knowledge sharing and networking.",
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
