import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  CalendarIcon,
  BuildingIcon,
  UsersIcon,
  BookOpenIcon,
  LayersIcon,
  SettingsIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@/components/Icons";

export const metadata = {
  title: "Admin Dashboard - Examination Timetable System",
  description: "Time Table & Class Allocation Committee Control Center",
};

export default async function AdminPage() {
  const supabase = await createClient();

  // Fetch quick metrics
  const [
    { count: deptCount },
    { count: classCount },
    { count: courseCount },
    { count: hallCount },
    { count: timetableCount },
  ] = await Promise.all([
    supabase.from("departments").select("*", { count: "exact", head: true }),
    supabase.from("classes").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("halls").select("*", { count: "exact", head: true }),
    supabase.from("timetables").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Timetables", value: timetableCount || 0, href: "/admin/timetables", icon: <CalendarIcon className="w-5 h-5 text-blue-600" /> },
    { label: "Departments", value: deptCount || 0, href: "/admin/departments", icon: <LayersIcon className="w-5 h-5 text-indigo-600" /> },
    { label: "Classes", value: classCount || 0, href: "/admin/classes", icon: <UsersIcon className="w-5 h-5 text-amber-600" /> },
    { label: "Courses", value: courseCount || 0, href: "/admin/courses", icon: <BookOpenIcon className="w-5 h-5 text-emerald-600" /> },
    { label: "Exam Halls", value: hallCount || 0, href: "/admin/halls", icon: <BuildingIcon className="w-5 h-5 text-purple-600" /> },
  ];

  const modules = [
    {
      title: "Timetable Builder & Conflict Engine",
      description: "Assemble exam entries, run real-time clash detections, and invoke the automatic scheduling assistant.",
      href: "/admin/timetables",
      badge: "Core Engine",
      icon: <CalendarIcon className="w-6 h-6 text-blue-900" />,
      color: "border-blue-600/30 hover:border-blue-600",
    },
    {
      title: "Academic Departments",
      description: "Define departments and their official code designations (e.g. SWD, COM, STA).",
      href: "/admin/departments",
      icon: <LayersIcon className="w-6 h-6 text-indigo-900" />,
      color: "border-slate-200 hover:border-slate-400",
    },
    {
      title: "Classes & Student Headcounts",
      description: "Configure classes (Department + Level) and maintain enrolled student headcounts.",
      href: "/admin/classes",
      icon: <UsersIcon className="w-6 h-6 text-amber-700" />,
      color: "border-slate-200 hover:border-slate-400",
    },
    {
      title: "Course Catalog",
      description: "Manage semester courses and their assigned class allocations.",
      href: "/admin/courses",
      icon: <BookOpenIcon className="w-6 h-6 text-emerald-800" />,
      color: "border-slate-200 hover:border-slate-400",
    },
    {
      title: "Examination Halls",
      description: "Manage physical exam halls, venues, and optional student seating capacities.",
      href: "/admin/halls",
      icon: <BuildingIcon className="w-6 h-6 text-purple-900" />,
      color: "border-slate-200 hover:border-slate-400",
    },
    {
      title: "Scheduling Settings",
      description: "Configure institutional conflict thresholds such as maximum classes per hall.",
      href: "/admin/settings",
      icon: <SettingsIcon className="w-6 h-6 text-slate-800" />,
      color: "border-slate-200 hover:border-slate-400",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-7 sm:p-9 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-blue-800/80 text-blue-200 text-xs font-semibold">
            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authorized Committee Session Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Timetable Committee Control Center
          </h1>
          <p className="text-blue-100/80 text-sm max-w-xl">
            Welcome to the centralized administration portal for examination scheduling, conflict validation, and hall allocations.
          </p>
        </div>

        <Link
          href="/admin/timetables"
          className="inline-flex items-center space-x-2 px-5 py-3 bg-white text-blue-950 font-bold text-sm rounded-xl hover:bg-blue-50 transition shadow-md shrink-0"
        >
          <span>Open Timetable Builder</span>
          <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      {/* Live System Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s, i) => (
          <Link
            key={i}
            href={s.href}
            className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{s.label}</span>
              {s.icon}
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {s.value}
            </div>
          </Link>
        ))}
      </div>

      {/* Module Directory */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Administration Modules</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`group p-6 bg-white rounded-2xl border ${item.color} shadow-2xs hover:shadow-md transition-all flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
                    {item.icon}
                  </div>
                  {item.badge && (
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-900 rounded-md">
                      {item.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-4 mt-2 flex items-center text-xs font-bold text-blue-900 group-hover:translate-x-1 transition-transform">
                <span>Manage Module</span>
                <ArrowRightIcon className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
