import Link from "next/link";

export const metadata = {
  title: "Admin Dashboard - Examination Timetable System",
  description: "Time Table & Class Allocation Committee Control Center",
};

export default function AdminPage() {
  const sections = [
    {
      title: "Timetable Builder",
      description: "Create and configure examination timetables with real-time conflict checking.",
      href: "/admin/timetables",
      badge: "Core",
      color: "border-blue-500 hover:border-blue-600",
    },
    {
      title: "Departments",
      description: "Manage academic departments (e.g., Computer Science, Electrical Engineering).",
      href: "/admin/departments",
      color: "border-slate-300 hover:border-slate-400",
    },
    {
      title: "Classes",
      description: "Manage classes (Department + Level, e.g., SWD HND 2) and student headcounts.",
      href: "/admin/classes",
      color: "border-slate-300 hover:border-slate-400",
    },
    {
      title: "Courses",
      description: "Manage semester courses and their assigned class associations.",
      href: "/admin/courses",
      color: "border-slate-300 hover:border-slate-400",
    },
    {
      title: "Examination Halls",
      description: "Configure halls, venues, and optional student seating capacities.",
      href: "/admin/halls",
      color: "border-slate-300 hover:border-slate-400",
    },
    {
      title: "System Settings",
      description: "Configure default rules like max allowable classes per exam hall.",
      href: "/admin/settings",
      color: "border-slate-300 hover:border-slate-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Committee Administration Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Time Table and Class Allocation Committee &bull; Akwa Ibom State Polytechnic
          </p>
        </div>
        <Link
          href="/admin/timetables"
          className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition"
        >
          Open Timetable Builder
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block p-6 bg-white rounded-xl border ${item.color} shadow-sm hover:shadow transition`}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                  {item.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
