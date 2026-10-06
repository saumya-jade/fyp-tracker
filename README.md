# Final-Year Project & Internship Tracker

A web app that helps colleges manage final-year projects and internships in one place: team registration, automatic guide allocation, weekly progress tracking, document uploads, review scheduling, and final submissions.

**Live demo:** https://fyp-tracker-zeta.vercel.app/
**Built for:** DevDevs

## Problem

Coordinators track teams, guides, reviews, and documents across spreadsheets and WhatsApp groups. Students miss deadlines, guides get uneven loads, and nobody has a single view of project status.

## Features

- **Student portal:** register a team, add members, choose guide preferences, log weekly progress, upload documents
- **Fair guide allocation:** deferred-acceptance matching based on team preferences, guide domains, and capacity, with a human-readable reason for every allocation
- **Review scheduling:** coordinators create review sessions and assign time slots per team
- **Coordinator dashboard:** live overview of all teams, progress, and final submission status
- **Document storage:** reports and presentations stored in Supabase Storage

## Tech Stack

- Next.js (App Router) with TypeScript
- Tailwind CSS
- Supabase (PostgreSQL + Storage)
- Deployed on Vercel

## How Allocation Works

Allocation uses a deferred-acceptance (Gale-Shapley style) algorithm:

1. Each team ranks up to three preferred guides.
2. Teams propose to their top choice first.
3. A guide tentatively accepts teams up to remaining capacity (capacity minus existing load).
4. If a guide is over capacity, the best-fitting teams are kept and the rest move to their next preference.
5. The process repeats until all teams are placed or preferences are exhausted.
6. Each result stores an `allocation_reason` explaining why the team got that guide.

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project

### Setup

```bash
git clone https://github.com/saumya-jade/fyp-tracker.git
cd fyp-tracker
npm install
```

Create a `.env.local` file (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000.

### Database

Tables: `teams`, `team_members`, `guides`, `progress_logs`, `documents`, `reviews`, `review_slots`, `final_submissions`.
Create a Storage bucket named `documents` for file uploads.

## Project Structure

```
src/
  app/
    page.tsx            Home
    student/            Student portal
    reviews/            Review schedule
    coordinator/        Coordinator dashboard
    allocate-test/      Guide allocation runner
  components/           Navbar, Steps, SubmissionsTable
  lib/
    supabase.ts         Supabase client
    allocate.ts         Allocation algorithm
```

## Limitations and Future Work

- Row Level Security is disabled for the hackathon demo; production needs authentication and RLS policies
- Separate logins and roles for students, guides, and coordinators
- Email or SMS reminders for upcoming reviews
- Guide-side portal for feedback and marks

## Team

Saumya Jade, Siddhi Shahu, Girija Mahajan