"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getExamPeriod, formatPeriodRange } from "@/lib/timeUtils";
import {
  CalendarIcon,
  PrinterIcon,
  SearchIcon,
  BuildingIcon,
  ClockIcon,
  PolyLogo,
  LayersIcon,
  UsersIcon,
} from "@/components/Icons";

const POLY_LEVELS = ["ND 1", "ND 2", "HND 1", "HND 2"];

export default function PublicTimetablesPage() {
  const [timetables, setTimetables] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Default to "ALL" so the entire school timetable is displayed at once (Notice Board View)
  const [selectedTimetableId, setSelectedTimetableId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("ALL");
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [selectedHall, setSelectedHall] = useState("ALL");
  const [selectedSession, setSelectedSession] = useState("ALL"); // ALL, MORNING, AFTERNOON

  const [exams, setExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupByDate, setGroupByDate] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingExams, setLoadingExams] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const supabase = createClient();

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true);

      const { data: ttData, error: ttErr } = await supabase
        .from("timetables")
        .select("*")
        .order("created_at", { ascending: false });

      if (ttErr) {
        setErrorMessage("Could not load timetables: " + ttErr.message);
      } else {
        setTimetables(ttData || []);
        if (ttData?.length > 0) {
          setSelectedTimetableId(ttData[0].id);
        }
      }

      const { data: deptData, error: deptErr } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true });

      if (deptErr) {
        setErrorMessage("Could not load departments: " + deptErr.message);
      } else {
        setDepartments(deptData || []);
      }

      setLoading(false);
    };

    fetchMetadata();
  }, []);

  // Fetch examination papers based on active timetable and optional filters
  useEffect(() => {
    if (!selectedTimetableId) {
      setExams([]);
      return;
    }

    const fetchClassExams = async () => {
      setLoadingExams(true);
      setErrorMessage("");

      let query = supabase
        .from("exams")
        .select(`
          id,
          exam_date,
          start_time,
          end_time,
          halls (id, name, capacity),
          courses!inner (
            id,
            code,
            title,
            classes!inner (
              id,
              level,
              student_count,
              department_id,
              departments (id, name, code)
            )
          )
        `)
        .eq("timetable_id", selectedTimetableId)
        .order("exam_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (selectedDepartmentId !== "ALL") {
        query = query.eq("courses.classes.department_id", selectedDepartmentId);
      }
      if (selectedLevel !== "ALL") {
        query = query.eq("courses.classes.level", selectedLevel);
      }

      const { data, error } = await query;

      if (error) {
        setErrorMessage("Failed to load timetable schedule: " + error.message);
      } else {
        setExams(data || []);
      }

      setLoadingExams(false);
    };

    fetchClassExams();
  }, [selectedTimetableId, selectedDepartmentId, selectedLevel]);

  const activeTimetable = timetables.find((t) => t.id === selectedTimetableId);
  const activeDepartment = departments.find((d) => d.id === selectedDepartmentId);

  // Derive distinct halls present in results for filtering
  const distinctHalls = Array.from(
    new Set(exams.map((e) => e.halls?.name).filter(Boolean))
  ).sort();

  // Search and session/hall filter
  const filteredExams = exams.filter((e) => {
    // Hall filter
    if (selectedHall !== "ALL" && e.halls?.name !== selectedHall) {
      return false;
    }

    // Morning / Afternoon Session filter
    const startHour = parseInt(String(e.start_time).split(":")[0], 10);
    if (selectedSession === "MORNING" && startHour >= 12) {
      return false;
    }
    if (selectedSession === "AFTERNOON" && startHour < 12) {
      return false;
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const code = e.courses?.code?.toLowerCase() || "";
    const title = e.courses?.title?.toLowerCase() || "";
    const hall = e.halls?.name?.toLowerCase() || "";
    const dept = e.courses?.classes?.departments?.name?.toLowerCase() || "";
    const deptCode = e.courses?.classes?.departments?.code?.toLowerCase() || "";
    const level = e.courses?.classes?.level?.toLowerCase() || "";

    return (
      code.includes(term) ||
      title.includes(term) ||
      hall.includes(term) ||
      dept.includes(term) ||
      deptCode.includes(term) ||
      level.includes(term)
    );
  });

  // Group papers by date for the general notice board format
  const examsByDate = filteredExams.reduce((groups, exam) => {
    const date = exam.exam_date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(exam);
    return groups;
  }, {});

  const handlePrint = () => {
    window.print();
  };

  const isMasterView = selectedDepartmentId === "ALL" && selectedLevel === "ALL";

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Interactive Controls Card (Hidden during printing) */}
      <div className="print:hidden space-y-4 sm:space-y-6">
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200/60 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>Notice Board &amp; Student Timetable Portal</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <CalendarIcon className="w-6 h-6 sm:w-7 sm:h-7 text-blue-900 shrink-0" />
              <span>Examination Timetable</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Browse the complete school-wide examination schedule, or filter by your specific department, class level, hall, or session.
            </p>
          </div>

          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2.5 shrink-0">
            {exams.length > 0 && (
              <button
                onClick={handlePrint}
                className="w-full sm:w-auto justify-center px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center space-x-2"
                title="Print Notice Board Timetable Document"
              >
                <PrinterIcon className="w-4 h-4 text-amber-300" />
                <span>Print {isMasterView ? "Master Notice Board" : "Class Timetable"}</span>
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl text-xs sm:text-sm shadow-xs">
            {errorMessage}
          </div>
        )}

        {/* Filter Controls Card */}
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Timetable Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Session
              </label>
              <select
                value={selectedTimetableId}
                onChange={(e) => setSelectedTimetableId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
              >
                {timetables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.session})
                  </option>
                ))}
              </select>
            </div>

            {/* Department Filter with "All Departments (Master View)" */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Department</span>
                {selectedDepartmentId !== "ALL" && (
                  <button
                    onClick={() => setSelectedDepartmentId("ALL")}
                    className="text-[11px] text-blue-900 hover:underline capitalize"
                  >
                    Reset
                  </button>
                )}
              </label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
              >
                <option value="ALL">🏛️ All Departments (Master View)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter with "All Levels" */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Class Level</span>
                {selectedLevel !== "ALL" && (
                  <button
                    onClick={() => setSelectedLevel("ALL")}
                    className="text-[11px] text-blue-900 hover:underline capitalize"
                  >
                    Reset
                  </button>
                )}
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
              >
                <option value="ALL">🎓 All Levels (ND 1 &ndash; HND 2)</option>
                {POLY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* Morning / Afternoon Session Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Session / Period
              </label>
              <select
                value={selectedSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
              >
                <option value="ALL">☀️ &amp; 🌤️ All (Morning &amp; Afternoon)</option>
                <option value="MORNING">☀️ Morning Only (9am &ndash; 12pm)</option>
                <option value="AFTERNOON">🌤️ Afternoon Only (1pm &ndash; 4pm)</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quick Search
              </label>
              <div className="relative">
                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Code, course, hall..."
                  className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
                />
              </div>
            </div>
          </div>

          {/* Quick Filter Badges / View Toggle */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-slate-500 font-semibold">View:</span>
              {isMasterView ? (
                <span className="px-2.5 py-1 bg-blue-100 text-blue-900 font-bold rounded-lg border border-blue-200">
                  🏛️ Master Notice Board
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg border border-amber-200">
                  Filtered: {activeDepartment ? activeDepartment.code : "All"} &bull; {selectedLevel !== "ALL" ? selectedLevel : "All"}
                </span>
              )}

              {selectedSession !== "ALL" && (
                <span className={`px-2 py-0.5 rounded-lg font-bold border ${
                  selectedSession === "MORNING"
                    ? "bg-amber-50 text-amber-900 border-amber-200"
                    : "bg-indigo-50 text-indigo-900 border-indigo-200"
                }`}>
                  {selectedSession === "MORNING" ? "☀️ Morning Only" : "🌤️ Afternoon Only"}
                </span>
              )}

              {distinctHalls.length > 0 && (
                <select
                  value={selectedHall}
                  onChange={(e) => setSelectedHall(e.target.value)}
                  className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 font-medium"
                >
                  <option value="ALL">All Halls ({distinctHalls.length})</option>
                  {distinctHalls.map((hName) => (
                    <option key={hName} value={hName}>
                      {hName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-2">
              <button
                onClick={() => setGroupByDate(!groupByDate)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  groupByDate
                    ? "bg-slate-200 text-slate-800"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {groupByDate ? "Day-by-Day" : "Flat List"}
              </button>
              <span className="text-slate-500 font-mono">
                {filteredExams.length} {filteredExams.length === 1 ? "paper" : "papers"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Notice Board Timetable Document */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6 lg:p-10 print:border-none print:shadow-none print:p-0">
        {/* Printable Official Letterhead */}
        <div className="text-center pb-5 sm:pb-6 border-b-2 border-slate-900 mb-6 space-y-1.5">
          <div className="inline-flex justify-center mb-1">
            <PolyLogo className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <h2 className="text-lg sm:text-2xl font-black uppercase text-slate-900 tracking-wide">
            Akwa Ibom State Polytechnic
          </h2>
          <p className="text-xs sm:text-sm font-bold uppercase text-slate-700">
            Ikot Osurua, Ikot Ekpene, Akwa Ibom State
          </p>
          <p className="text-[11px] sm:text-xs uppercase text-slate-600 font-semibold tracking-wider">
            Time Table and Class Allocation Committee &bull; Directorate of Academic Affairs
          </p>
          <div className="pt-2">
            <h3 className="text-sm sm:text-xl font-black text-blue-900 print:text-black uppercase">
              {isMasterView
                ? "Official Master Examination Timetable (General Notice Board Roster)"
                : `${activeDepartment?.name || "Academic"} (${selectedLevel}) Examination Timetable`}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
              {activeTimetable?.title || "Examination Timetable"} &bull; Session: {activeTimetable?.session} ({activeTimetable?.semester})
              {selectedSession !== "ALL" && ` • ${selectedSession === "MORNING" ? "MORNING PAPERS (9AM – 12PM)" : "AFTERNOON PAPERS (1PM – 4PM)"}`}
              {selectedHall !== "ALL" && ` • Venue: ${selectedHall}`}
            </p>
          </div>
        </div>

        {/* Timetable Content */}
        {loading || loadingExams ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading examination schedule...</div>
        ) : filteredExams.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            {searchTerm
              ? `No examination papers matching "${searchTerm}".`
              : "No examination papers scheduled for the selected view."}
          </div>
        ) : groupByDate ? (
          /* Day-by-Day Notice Board View */
          <div className="space-y-6 sm:space-y-8">
            {Object.entries(examsByDate).map(([dateStr, dateExams]) => {
              const formattedDate = new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              const morningExams = dateExams.filter((e) => parseInt(String(e.start_time).split(":")[0], 10) < 12);
              const afternoonExams = dateExams.filter((e) => parseInt(String(e.start_time).split(":")[0], 10) >= 12);

              return (
                <div key={dateStr} className="space-y-3 sm:space-y-4">
                  {/* Day Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl print:bg-slate-200 print:text-black gap-2">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 text-amber-300 print:text-black shrink-0" />
                      <span className="font-black text-xs sm:text-sm tracking-wide uppercase">
                        {formattedDate} ({dateStr})
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-semibold">
                      {morningExams.length > 0 && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 print:text-black rounded">
                          ☀️ {morningExams.length} Morning
                        </span>
                      )}
                      {afternoonExams.length > 0 && (
                        <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 print:text-black rounded">
                          🌤️ {afternoonExams.length} Afternoon
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Morning Session */}
                  {morningExams.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 px-1 text-xs font-bold text-amber-950 uppercase tracking-wider">
                        <span>☀️</span>
                        <span>Morning Session &bull; 9:00 AM &ndash; 12:00 PM</span>
                      </div>

                      {/* Mobile Card List (Hidden on tablet/desktop & print) */}
                      <div className="grid grid-cols-1 gap-2.5 md:hidden print:hidden">
                        {morningExams.map((item) => {
                          const deptCode = item.courses?.classes?.departments?.code || "DEPT";
                          const level = item.courses?.classes?.level || "";
                          const className = `${deptCode} ${level}`;
                          const time12 = formatPeriodRange(item.start_time, item.end_time);

                          return (
                            <div key={item.id} className="bg-amber-50/20 p-3.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-mono font-black text-blue-900 text-sm">{item.courses?.code}</div>
                                  <div className="text-xs font-bold text-slate-800 leading-snug">{item.courses?.title}</div>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-950 border border-amber-300 shrink-0">
                                  ☀️ Morning
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-600 font-mono pt-1">
                                <span>{time12}</span>
                                <span className="px-2 py-0.5 bg-white text-slate-800 font-bold rounded border border-slate-200">
                                  {className} ({item.courses?.classes?.student_count || 0})
                                </span>
                              </div>
                              <div className="pt-1.5 border-t border-amber-200/50 flex items-center justify-between text-xs font-bold text-slate-900">
                                <span className="flex items-center space-x-1">
                                  <BuildingIcon className="w-3.5 h-3.5 text-purple-700" />
                                  <span>{item.halls?.name}</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop & Print Table */}
                      <div className="hidden md:block print:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-300 text-sm print:text-xs border border-slate-300">
                          <thead className="bg-amber-50/70 text-amber-950 font-bold text-left print:bg-slate-150 print:text-black">
                            <tr>
                              <th className="px-3.5 py-2 border border-slate-300 w-36">Session / Time</th>
                              <th className="px-3.5 py-2 border border-slate-300 w-28">Course Code</th>
                              <th className="px-3.5 py-2 border border-slate-300">Course Title</th>
                              <th className="px-3.5 py-2 border border-slate-300 w-32">Offering Class</th>
                              <th className="px-3.5 py-2 border border-slate-300 w-36">Hall Venue</th>
                              <th className="px-3.5 py-2 border border-slate-300 text-center w-24">Students</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {morningExams.map((item, idx) => {
                              const deptCode = item.courses?.classes?.departments?.code || "DEPT";
                              const level = item.courses?.classes?.level || "";
                              const className = `${deptCode} ${level}`;
                              const time12 = formatPeriodRange(item.start_time, item.end_time);

                              return (
                                <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-amber-50/20"}>
                                  <td className="px-3.5 py-2 whitespace-nowrap border border-slate-300">
                                    <div className="font-bold text-amber-950 text-xs">☀️ Morning Paper</div>
                                    <div className="font-mono text-xs font-bold text-slate-800">{time12}</div>
                                  </td>
                                  <td className="px-3.5 py-2 font-mono font-black text-blue-900 print:text-black whitespace-nowrap border border-slate-300">
                                    {item.courses?.code}
                                  </td>
                                  <td className="px-3.5 py-2 text-slate-900 font-medium border border-slate-300">
                                    {item.courses?.title}
                                  </td>
                                  <td className="px-3.5 py-2 whitespace-nowrap border border-slate-300">
                                    <span className="px-2 py-0.5 bg-slate-100 print:bg-transparent text-slate-900 rounded font-bold text-xs">
                                      {className}
                                    </span>
                                  </td>
                                  <td className="px-3.5 py-2 font-bold text-slate-900 whitespace-nowrap border border-slate-300">
                                    {item.halls?.name}
                                  </td>
                                  <td className="px-3.5 py-2 text-center font-mono font-bold text-slate-800 border border-slate-300">
                                    {item.courses?.classes?.student_count || 0}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Afternoon Session */}
                  {afternoonExams.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center space-x-2 px-1 text-xs font-bold text-indigo-950 uppercase tracking-wider">
                        <span>🌤️</span>
                        <span>Afternoon Session &bull; 1:00 PM &ndash; 4:00 PM</span>
                      </div>

                      {/* Mobile Card List (Hidden on tablet/desktop & print) */}
                      <div className="grid grid-cols-1 gap-2.5 md:hidden print:hidden">
                        {afternoonExams.map((item) => {
                          const deptCode = item.courses?.classes?.departments?.code || "DEPT";
                          const level = item.courses?.classes?.level || "";
                          const className = `${deptCode} ${level}`;
                          const time12 = formatPeriodRange(item.start_time, item.end_time);

                          return (
                            <div key={item.id} className="bg-indigo-50/20 p-3.5 rounded-xl border border-indigo-200/80 shadow-2xs space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="font-mono font-black text-blue-900 text-sm">{item.courses?.code}</div>
                                  <div className="text-xs font-bold text-slate-800 leading-snug">{item.courses?.title}</div>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-100 text-indigo-950 border border-indigo-300 shrink-0">
                                  🌤️ Afternoon
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-600 font-mono pt-1">
                                <span>{time12}</span>
                                <span className="px-2 py-0.5 bg-white text-slate-800 font-bold rounded border border-slate-200">
                                  {className} ({item.courses?.classes?.student_count || 0})
                                </span>
                              </div>
                              <div className="pt-1.5 border-t border-indigo-200/50 flex items-center justify-between text-xs font-bold text-slate-900">
                                <span className="flex items-center space-x-1">
                                  <BuildingIcon className="w-3.5 h-3.5 text-purple-700" />
                                  <span>{item.halls?.name}</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Desktop & Print Table */}
                      <div className="hidden md:block print:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-300 text-sm print:text-xs border border-slate-300">
                          <thead className="bg-indigo-50/70 text-indigo-950 font-bold text-left print:bg-slate-150 print:text-black">
                            <tr>
                              <th className="px-3.5 py-2 border border-slate-300 w-36">Session / Time</th>
                              <th className="px-3.5 py-2 border border-slate-300 w-28">Course Code</th>
                              <th className="px-3.5 py-2 border border-slate-300">Course Title</th>
                              <th className="px-3.5 py-2 border border-slate-300 w-32">Offering Class</th>
                              <th className="px-3.5 py-2 border border-slate-300 w-36">Hall Venue</th>
                              <th className="px-3.5 py-2 border border-slate-300 text-center w-24">Students</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {afternoonExams.map((item, idx) => {
                              const deptCode = item.courses?.classes?.departments?.code || "DEPT";
                              const level = item.courses?.classes?.level || "";
                              const className = `${deptCode} ${level}`;
                              const time12 = formatPeriodRange(item.start_time, item.end_time);

                              return (
                                <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-indigo-50/20"}>
                                  <td className="px-3.5 py-2 whitespace-nowrap border border-slate-300">
                                    <div className="font-bold text-indigo-950 text-xs">🌤️ Afternoon Paper</div>
                                    <div className="font-mono text-xs font-bold text-slate-800">{time12}</div>
                                  </td>
                                  <td className="px-3.5 py-2 font-mono font-black text-blue-900 print:text-black whitespace-nowrap border border-slate-300">
                                    {item.courses?.code}
                                  </td>
                                  <td className="px-3.5 py-2 text-slate-900 font-medium border border-slate-300">
                                    {item.courses?.title}
                                  </td>
                                  <td className="px-3.5 py-2 whitespace-nowrap border border-slate-300">
                                    <span className="px-2 py-0.5 bg-slate-100 print:bg-transparent text-slate-900 rounded font-bold text-xs">
                                      {className}
                                    </span>
                                  </td>
                                  <td className="px-3.5 py-2 font-bold text-slate-900 whitespace-nowrap border border-slate-300">
                                    {item.halls?.name}
                                  </td>
                                  <td className="px-3.5 py-2 text-center font-mono font-bold text-slate-800 border border-slate-300">
                                    {item.courses?.classes?.student_count || 0}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat Table View (Responsive cards on mobile, table on desktop/print) */
          <div>
            {/* Mobile Card List */}
            <div className="grid grid-cols-1 gap-2.5 md:hidden print:hidden">
              {filteredExams.map((item) => {
                const deptCode = item.courses?.classes?.departments?.code || "DEPT";
                const level = item.courses?.classes?.level || "";
                const className = `${deptCode} ${level}`;
                const period = getExamPeriod(item.start_time);
                const time12 = formatPeriodRange(item.start_time, item.end_time);

                return (
                  <div key={item.id} className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-black text-blue-900 text-sm">{item.courses?.code}</div>
                        <div className="text-xs font-bold text-slate-800 leading-snug">{item.courses?.title}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${period.badgeClass} shrink-0`}>
                        {period.icon} {period.session}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 font-mono">
                      <span>{item.exam_date}</span>
                      <span>{time12}</span>
                    </div>
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-900">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800">
                        {className} ({item.courses?.classes?.student_count || 0})
                      </span>
                      <span className="flex items-center space-x-1">
                        <BuildingIcon className="w-3.5 h-3.5 text-purple-700" />
                        <span>{item.halls?.name}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop & Print Table */}
            <div className="hidden md:block print:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-300 text-sm print:text-xs border border-slate-300">
                <thead className="bg-slate-100 text-slate-900 font-bold text-left print:bg-slate-200">
                  <tr>
                    <th className="px-4 py-3 border border-slate-300">Date</th>
                    <th className="px-4 py-3 border border-slate-300">Session &bull; Period (Time)</th>
                    <th className="px-4 py-3 border border-slate-300">Course Code</th>
                    <th className="px-4 py-3 border border-slate-300">Course Title</th>
                    <th className="px-4 py-3 border border-slate-300">Offering Class</th>
                    <th className="px-4 py-3 border border-slate-300">Hall Venue</th>
                    <th className="px-4 py-3 border border-slate-300 text-center">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredExams.map((item, idx) => {
                    const deptCode = item.courses?.classes?.departments?.code || "DEPT";
                    const level = item.courses?.classes?.level || "";
                    const className = `${deptCode} ${level}`;
                    const period = getExamPeriod(item.start_time);
                    const time12 = formatPeriodRange(item.start_time, item.end_time);

                    return (
                      <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                        <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap border border-slate-300">
                          {item.exam_date}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap border border-slate-300">
                          <span className={`inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded ${period.badgeClass}`}>
                            <span>{period.icon}</span>
                            <span>{period.session}</span>
                          </span>
                          <div className="font-mono text-xs font-bold text-slate-800 mt-0.5">{time12}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-black text-blue-900 print:text-black whitespace-nowrap border border-slate-300">
                          {item.courses?.code}
                        </td>
                        <td className="px-4 py-3 text-slate-900 font-medium border border-slate-300">
                          {item.courses?.title}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap border border-slate-300">
                          <span className="px-2 py-0.5 bg-slate-100 print:bg-transparent text-slate-800 rounded font-bold text-xs">
                            {className}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap border border-slate-300">
                          {item.halls?.name}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap font-mono text-slate-700 border border-slate-300">
                          {item.courses?.classes?.student_count || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Print Footer / Official Committee Endorsement */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-6 text-xs text-slate-700 border-t border-slate-400">
          <div className="text-left space-y-1">
            <p className="font-bold">Instructions to Candidates &amp; Invigilators:</p>
            <p>1. Morning papers commence at 9:00 AM; Afternoon papers commence at 1:00 PM prompt.</p>
            <p>2. Candidates must arrive at their designated examination hall 30 minutes before the scheduled start time.</p>
            <p>3. Presentation of a valid student identity card and examination clearance card is strictly mandatory.</p>
            <p>4. No mobile phones, smartwatches, or unauthorized study materials are permitted in the halls.</p>
          </div>
          <div className="text-right space-y-10">
            <div>___________________________________________________</div>
            <div className="font-bold">Chairman, Time Table &amp; Class Allocation Committee</div>
          </div>
        </div>
      </div>
    </div>
  );
}
