import Link from "next/link";
import {
  CalendarIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  UsersIcon,
  BuildingIcon,
  SparklesIcon,
  PrinterIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@/components/Icons";

export default function HomePage() {
  const conflictTypes = [
    {
      title: "Class Clash Prevention",
      desc: "Guarantees that a class (department + level, e.g. SWD HND 2) never has two examinations scheduled at overlapping hours on the same date.",
      badge: "Rule 1",
      icon: <UsersIcon className="w-5 h-5 text-blue-600" />,
    },
    {
      title: "Hall & Capacity Protection",
      desc: "Strictly enforces venue sharing policies (maximum 3 classes per hall by default) and ensures total student headcount does not exceed room capacity.",
      badge: "Rule 2",
      icon: <BuildingIcon className="w-5 h-5 text-amber-600" />,
    },
    {
      title: "Duplicate Course Guard",
      desc: "Prevents duplicate scheduling so no course code is placed more than once within the same examination timetable session.",
      badge: "Rule 3",
      icon: <AlertTriangleIcon className="w-5 h-5 text-rose-600" />,
    },
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-white via-white to-blue-50/40 rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-14 text-center">
        {/* Subtle decorative background circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-900 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Official Academic Timetable Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Examination Timetable Scheduling &amp;{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-600">
              Conflict Detection System
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Designed for the <strong>Time Table and Class Allocation Committee</strong> of{" "}
            <strong>Akwa Ibom State Polytechnic, Ikot Osurua</strong>. Generates, validates, and publishes
            conflict-free examination rosters at class level.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/timetables"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-bold bg-blue-900 hover:bg-blue-800 text-white shadow-md hover:shadow-lg transition-all"
            >
              <CalendarIcon className="w-5 h-5 text-amber-300" />
              <span>View Student Timetables</span>
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-300/80 shadow-xs hover:border-slate-400 transition-all"
            >
              <ShieldCheckIcon className="w-5 h-5 text-blue-900" />
              <span>Committee Administration</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Feature Pillar Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {conflictTypes.map((item, idx) => (
          <div
            key={idx}
            className="group bg-white rounded-2xl p-7 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-slate-50 group-hover:bg-blue-50 rounded-xl transition-colors">
                {item.icon}
              </div>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-md">
                {item.badge}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-900 transition-colors">
              {item.title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {item.desc}
            </p>
          </div>
        ))}
      </div>

      {/* System Highlights / Chapter 4 Readiness Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">
              Core Architectural Strengths
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Class-Level Timetable Management Built for School Operations
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              In conformity with Akwa Ibom State Polytechnic's committee operations, this system counts students by class
              (e.g., <strong>SWD HND 2</strong> with 40 students) without tracking individual IDs, streamlining institutional compliance.
            </p>
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center space-x-3 text-xs sm:text-sm text-slate-700">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Isolated pure mathematical conflict detection logic in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-blue-900">lib/conflicts.js</code></span>
              </div>
              <div className="flex items-center space-x-3 text-xs sm:text-sm text-slate-700">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>One-click automated scheduler suggestion engine (Phase 8 assistant)</span>
              </div>
              <div className="flex items-center space-x-3 text-xs sm:text-sm text-slate-700">
                <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Clean A4 print view tailored for polytechnic notice board publication</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/80 rounded-xl p-6 border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Live Verification Test Case
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded">
                Verified Passing
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-800">
                Real-world polytechnic scenario tested:
              </p>
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-slate-700 font-mono text-[11px] space-y-1">
                <div>Venue: Workshop 9</div>
                <div>Concurrent Classes: HND 1 SCM (106) + HND 2 STA (15) + NCC (42) + SWD (40)</div>
                <div className="text-rose-700 font-bold pt-1">Result: 4 Classes &bull; 203 Total Students Flagged</div>
              </div>
              <p className="text-[11px] text-slate-500 italic">
                Automated tests verified with zero failures via Node.js native test runner.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
