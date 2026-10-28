import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 sm:p-12 text-center max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Examination Timetable Scheduling &amp; Conflict Detection
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          Official Examination Timetable Portal for Akwa Ibom State Polytechnic, Ikot Osurua.
          Check exam dates, times, and venue allocations with automated conflict detection.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/timetables"
            className="px-6 py-3 rounded-lg font-semibold bg-blue-900 text-white hover:bg-blue-800 transition shadow-sm"
          >
            View Timetables
          </Link>
          <Link
            href="/admin"
            className="px-6 py-3 rounded-lg font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 transition"
          >
            Committee Login / Admin
          </Link>
        </div>
      </div>

      {/* Feature / Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Class-Level Scheduling</h2>
          <p className="text-sm text-slate-600">
            Schedules operate at class level (Department + Level, e.g. SWD HND 2), matching how the timetable committee operates.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Automated Conflict Detection</h2>
          <p className="text-sm text-slate-600">
            Instantly detects class time clashes, hall capacity and class-count limits, and duplicate course entries.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Print &amp; Export Ready</h2>
          <p className="text-sm text-slate-600">
            Students and staff can view, search, and print clean class timetables without logging in.
          </p>
        </div>
      </div>
    </div>
  );
}
