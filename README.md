<p align="center">
 <img width="100px" src="https://github.com/user-attachments/assets/3ef0eb30-e067-4c05-86cd-6079fcfe8960" align="center" alt="DevQuest Logo" />
 <h2 align="center">DevQuest</h2>
 <p align="center">An open-source career progression platform for DEVCON Kids volunteers</p>
</p>
<p align="center">
    <a href="https://github.com/Devcon-Pampanga/DevQuest/graphs/contributors">
      <img alt="GitHub Contributors" src="https://img.shields.io/github/contributors/Devcon-Pampanga/DevQuest?color=0088ff"/>
    </a>
    <a href="https://github.com/Devcon-Pampanga/DevQuest/issues">
      <img alt="Issues" src="https://img.shields.io/github/issues/Devcon-Pampanga/DevQuest?color=0088ff"/>
    </a>
    <a href="https://github.com/Devcon-Pampanga/DevQuest/pulls">
      <img alt="GitHub pull requests" src="https://img.shields.io/github/issues-pr/Devcon-Pampanga/DevQuest?color=0088ff"/>
    </a>
  </p>

  <p align="center">
    <a target="_blank" href="https://dev-quest-lilac.vercel.app/">View Demo</a>
    ·
    <a target="_blank" href="https://github.com/Devcon-Pampanga/DevQuest/wiki/Project-Overview">Project Overview</a>
    ·
    <a href="https://github.com/Devcon-Pampanga/DevQuest/issues/new?labels=bug">Report Bug</a>
    ·
    <a href="https://github.com/Devcon-Pampanga/DevQuest/issues/new?labels=enhancement">Request Feature</a>
    ·
    <a href="https://github.com/Devcon-Pampanga/DevQuest/wiki/FAQ">FAQ</a>
    ·
    <a href="https://github.com/Devcon-Pampanga/DevQuest/discussions/categories/q-a">Ask Question</a>
  </p>

## About the Project

**DevQuest** is an open-source career progression platform that transforms DEVCON Kids volunteer work into verifiable professional milestones through structured quest lines, tracked contributions, and exportable portfolios.

## Problem and Objective

DEVCON Kids Pampanga student volunteers face high churn and a confidence gap. Without a structured way to track their contributions or connect their work to real career credentials, high-potential local talent burns out and walks away with nothing to show for it.

DevQuest aims to solve this by turning volunteer participation into measurable, portfolio-ready proof of growth.

## Features

- **Proof of Presence** - QR scan attendance for events and sessions.
- **Track-based Quest Lines** - Guided contribution pathways per role or skill track.
- **Level-Up Dashboard** - Visual progress tracking with milestones and achievements.
- **Season Leaderboard** - Friendly competition with transparent contribution scoring.
- **One-Tap Portfolio Export** - Exportable records of volunteer impact and completed quests.

## Tech Stack

- **Next.js 14** - App Router framework
- **React** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Firebase** - Firestore, Authentication, and Storage backend services

## Installation Guide

1. Clone this repository.
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.local.example` to `.env.local` and fill in your Firebase project values.
4. Start the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Screenshots
 
**1. Authentication & Onboarding**
<br>
<img height="300" src="https://github.com/user-attachments/assets/0808073e-a9dd-47dd-81fb-55dc41c5923e">
<img height="300" src="https://github.com/user-attachments/assets/905e4ec1-563c-4510-9ffa-e0e7a28bf3f3">
<img height="300" src="https://github.com/user-attachments/assets/e878f754-71b4-4c8a-bf0b-2e3ba85b0ccf">
<br>

**2. Volunteer Profile**
<br>
<img height="300" src="https://github.com/user-attachments/assets/22bec498-9335-4e3c-9db1-d53037b74015">
<img height="300" src="https://github.com/user-attachments/assets/92cde073-af9b-4cd4-8419-3da7a160d680">
<br>

**3. Quests & Milestones**
<br>
<img height="300" src="https://github.com/user-attachments/assets/f6dab79a-b5d8-4049-a508-80032cfdc8c4">
<img height="300" src="https://github.com/user-attachments/assets/d157effd-bb22-4159-ab50-0ce236694982">
<br>

**4. Events & Details**
<br>
<img height="300" src="https://github.com/user-attachments/assets/af2f2913-a4a6-4beb-9597-91c39350c400">
<img height="300" src="https://github.com/user-attachments/assets/b7cb4502-62fa-4159-8434-947418eb4d47">
<img height="300" src="https://github.com/user-attachments/assets/558b9410-a23b-4348-8f66-f5dd1fd69201">
<img height="300" src="https://github.com/user-attachments/assets/baa56c0f-bf41-4b46-a7e9-45ae6eb9c03a">
<br>

**5. Chapter Profile & Leaderboards**
<br>
<img height="300" src="https://github.com/user-attachments/assets/cd035370-1f57-4dc3-9c77-34caf7fb433c">
<img height="300" src="https://github.com/user-attachments/assets/6b977391-bddc-4700-9ea4-2506ad48d07f">
<br>


**6. Rewards & Marketplace**
<br>
<img height="300" src="https://github.com/user-attachments/assets/5f8992d4-00e9-4742-89aa-6853df4dfe46">
<br>


## Team Members

- Kiel Albiend David
- Joaquin Galang
- Russel Jan Patio
- Russelle Roxas
- Reign Sanchez

## Future Improvements

**Governance & Role Management**

A Super Admin tier will be introduced for multi-chapter oversight and the direct management of coordinator roles. To maintain a secure and professional community, registration will transition to a coordinator-approval model supported by dedicated domain emails for all members.

**Engagement & Availability Tracking**

A Volunteer Calendar will be implemented to allow members to log their schedules, facilitating event planning around academic and work commitments. Furthermore, automated dormancy alerts will trigger notifications if activity levels drop, allowing for timely well-being check-ins.

**AI Analytics & Impact Reporting**

New AI-driven insights will automatically summarize long-form reflection feedback, transforming qualitative data into actionable summaries. These tools will generate automated impact reports, distilling chapter-wide performance and volunteer growth into professional, ready-to-share data.
