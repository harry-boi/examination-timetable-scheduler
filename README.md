# Web-Based Examination Timetable Scheduling & Conflict Detection System

> **Automated conflict-free examination timetable generation, multi-hall allocation, and official landscape notice board roster for tertiary institutions.**  
> *Customized for Akwa Ibom State Polytechnic, Ikot Osurua (Time Table and Class Allocation Committee).*

---

## 📌 Repository Description (GitHub About)

> **Automated examination timetable scheduling and conflict detection system for tertiary institutions with multi-hall load balancing, weekday spacing heuristics, and official landscape notice board print layout.**

---

## 🌟 Key Features

### 1. Intelligent Auto-Scheduler Algorithm
- **Polytechnic Weekday Policy:** Strictly allocates exams within Monday to Friday (`dayOfWeek !== 0 && dayOfWeek !== 6`), completely avoiding weekends.
- **Single Paper Daily Limit:** Guarantees that a student class (e.g. `ND 1 CSC`) is never scheduled for more than one paper on any given date.
- **Configurable Study Rest Gaps:** Allows administrators to enforce multi-day gaps (`0`, `1`, or `2+` days) between consecutive examinations for each class.
- **Date Striding & Window Spreading:** Evenly distributes exams across the entire examination calendar (`Spread Across Window`) or packs them efficiently (`Consecutive Weekdays`).
- **Multi-Hall Load Balancing:** Rotates venues dynamically using assignment frequency penalties, ensuring all campus halls and workshops are evenly utilized rather than over-concentrating in a single venue.
- **Session Allocation:** Balances exams between **Morning Session** (9:00 AM – 12:00 PM) and **Afternoon Session** (1:00 PM – 4:00 PM), with options for Morning-Only or Afternoon-Only allocations.

### 2. Real-Time Conflict Detection Engine
Detects scheduling clashes instantly before and during manual overrides:
- **Class Clash:** Identifies overlapping examination papers scheduled for the same class at the same time.
- **Duplicate Course:** Hard-blocks scheduling the same course multiple times in a timetable.
- **Hall Capacity Violations:** Compares total enrolled student headcount against the physical capacity of the allocated hall.
- **Venue Congestion:** Enforces maximum simultaneous classes per venue (`max_classes_per_hall`) to prevent hall overcrowding.

### 3. Authentic Institutional Timetable & Print Layout
- **A4 Landscape Print Layout:** Specially formatted `@page { size: A4 landscape; margin: 6mm 8mm; }` with zero cut-offs and automated page-break controls.
- **Institutional Header:** Complete with Polytechnic emblem, Directorate of Academic Affairs, and Committee heading.
- **Dual-Session Side-by-Side Grid:**
  - `DATE` (vertical row-spanning cell)
  - `MORNING: 9.00AM – 12.00NOON` (`PROGRAMME`, `COURSE`, `VENUE`, `INVIGILATORS`)
  - `AFTERNOON: 1.00PM – 4.00PM` (`PROGRAMME`, `COURSE`, `VENUE`, `INVIGILATORS`)
- **Venue-Centric Multi-Course Clustering:** Courses sharing the same hall during a session are clustered cleanly into unified venue blocks.
- **Invigilator Sign-Off Column:** Dedicated dotted signature areas for invigilator duty rosters and script returns.
- **Official Committee Endorsement & CC List:** Includes chairman sign-off lines, hall directives, and the verbatim institutional distribution list (`RECTOR`, `DEPUTY RECTOR`, `REGISTRAR`, `DEANS/HODS`, `DIRECTOR DERR`, `O/C SECURITY`, etc.).

### 4. Public Student Notice Board & Mobile Responsive Portal
- **Master Notice Board View:** Displays the full school-wide roster in one centralized location for general pasting.
- **Granular Filtering:** Fast search and filtering by Department, Class Level (`ND 1`, `ND 2`, `HND 1`, `HND 2`), Venue/Hall, or Morning/Afternoon session.
- **Multiple Layout Views:** Switch between **Official Grid**, **Day-by-Day Cards**, and **Flat Management List**.
- **Mobile-First Experience:** Adaptive navigation drawer, horizontal admin toolbars, and touch-optimized form inputs.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| **UI Library** | [React 19](https://react.dev) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) |
| **Database & Auth** | [Supabase](https://supabase.com) (PostgreSQL, Row Level Security, Auth SSR) |
| **Testing** | Node.js native test runner (`node --test`) |
| **Language** | JavaScript (ESM) |

---

## 📁 Project Structure

```text
timetable_scheduling/
├── app/
│   ├── admin/
│   │   ├── classes/        # Manage academic classes & headcounts (ND/HND)
│   │   ├── courses/        # Manage course catalog & class associations
│   │   ├── departments/    # Manage academic departments & codes
│   │   ├── halls/          # Manage halls, workshops & capacities
│   │   ├── settings/       # System rules (max classes per venue, etc.)
│   │   └── timetables/     # Timetable builder, auto-scheduler & management
│   ├── login/              # Admin authentication portal
│   ├── timetables/         # Public notice board & student timetable portal
│   ├── globals.css         # Global styles & landscape print media queries
│   └── layout.js           # Root layout & navigation bar
├── components/
│   ├── AdminNav.js         # Mobile-responsive horizontal admin bar
│   ├── Icons.js            # Zero-dependency SVG iconography & PolyLogo
│   ├── Navbar.js           # Public navigation bar with responsive drawer
│   └── OfficialTimetableGrid.js # Landscape dual-session printable grid component
├── lib/
│   ├── conflicts.js        # Pure conflict detection engine (clashes & capacity)
│   ├── timeUtils.js        # Time parser & session categorization (Morning/Afternoon)
│   ├── timetableFormatters.js # Venue-clustering & polytechnic date formatting engine
│   └── supabase/           # Supabase client, server & middleware helpers
├── supabase/
│   └── schema.sql          # PostgreSQL schema, foreign keys & RLS policies
└── tests/
    ├── conflicts.test.js   # Unit tests for conflict detection algorithms
    └── timetableFormatters.test.js # Unit tests for venue clustering & formatting
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** v18.17+ or v20+ recommended
- **npm:** v9+
- A free **[Supabase](https://supabase.com)** project

### 2. Clone the Repository
```bash
git clone https://github.com/harry-boi/examination-timetable-scheduler.git
cd examination-timetable-scheduler
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
1. Open your Supabase project dashboard.
2. Navigate to the **SQL Editor**.
3. Copy and run the entire content of [`supabase/schema.sql`](./supabase/schema.sql). This will create all necessary tables (`departments`, `classes`, `courses`, `halls`, `timetables`, `exams`, `settings`), establish foreign key cascades, and configure RLS.

### 5. Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```
*(Reference values can be found in [`.env.example`](./.env.example)).*

### 6. Run the Application
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Automated Tests

Run the unit test suite covering conflict detection, capacity checks, date formatting, and venue clustering:

```bash
npm test
```

Build verification for production:
```bash
npm run build
```

---

## 📄 License

This project was developed as a Final Year Software Engineering Project for **Akwa Ibom State Polytechnic, Ikot Osurua**. Open for academic and institutional scheduling automation.
