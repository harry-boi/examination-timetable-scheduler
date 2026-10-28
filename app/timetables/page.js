"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

  // Search and hall filter
  const filteredExams = exams.filter((e) => {
    if (selectedHall !== "ALL" && e.halls?.name !== selectedHall) {
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
    <div className="space-y-6">
      {/* Interactive Controls Card (Hidden during printing) */}
      <div className="print:hidden space-y-6">
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200/60 text-xs font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>General Notice Board &amp; Class Timetable Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <CalendarIcon className="w-7 h-7 text-blue-900" />
              <span>Examination Timetable</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Browse the complete school-wide examination schedule, or filter by your specific department, class level, or hall.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {exams.length > 0 && (
              <button
                onClick={handlePrint}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center space-x-2"
                title="Print Notice Board Timetable Document"
              >
                <PrinterIcon className="w-4 h-4 text-amber-300" />
                <span>Print {isMasterView ? "Master Notice Board Timetable" : "Class Timetable"}</span>
              </button>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl text-sm shadow-xs">
            {errorMessage}
          </div>
        )}

        {/* Filter Controls Card */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Timetable Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Examination Session
              </label>
              <select
                value={selectedTimetableId}
                onChange={(e) => setSelectedTimetableId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
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
                    Show all
                  </button>
                )}
              </label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
              >
                <option value="ALL">🏛️ All Departments (Master Notice Board View)</option>
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
                    Show all
                  </button>
                )}
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
              >
                <option value="ALL">🎓 All Levels (ND 1, ND 2, HND 1, HND 2)</option>
                {POLY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Quick Search
              </label>
              <div className="relative">
                <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Code, course title, hall..."
                  className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
                />
              </div>
            </div>
          </div>

          {/* Quick Filter Badges / View Toggle */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-semibold">Active View:</span>
              {isMasterView ? (
                <span className="px-2.5 py-1 bg-blue-100 text-blue-900 font-bold rounded-lg border border-blue-200">
                  🏛️ General Master Notice Board (All Departments &amp; Classes)
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg border border-amber-200">
                  Filtered: {activeDepartment ? activeDepartment.code : "All Depts"} &bull; {selectedLevel !== "ALL" ? selectedLevel : "All Levels"}
                </span>
              )}

              {distinctHalls.length > 0 && (
                <select
                  value={selectedHall}
                  onChange={(e) => setSelectedHall(e.target.value)}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 font-medium"
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

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setGroupByDate(!groupByDate)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  groupByDate
                    ? "bg-slate-200 text-slate-800"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {groupByDate ? "Grouped by Day" : "Flat List"}
              </button>
              <span className="text-slate-500 font-mono">
                {filteredExams.length} {filteredExams.length === 1 ? "paper" : "papers"} total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Notice Board Timetable Document */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-10 print:border-none print:shadow-none print:p-0">
        {/* Printable Official Letterhead */}
        <div className="text-center pb-6 border-b-2 border-slate-900 mb-6 space-y-1.5">
          <div className="inline-flex justify-center mb-1">
            <PolyLogo className="w-12 h-12" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase text-slate-900 tracking-wide">
            Akwa Ibom State Polytechnic
          </h2>
          <p className="text-xs sm:text-sm font-bold uppercase text-slate-700">
            Ikot Osurua, Ikot Ekpene, Akwa Ibom State
          </p>
          <p className="text-xs uppercase text-slate-600 font-semibold tracking-wider">
            Time Table and Class Allocation Committee &bull; Directorate of Academic Affairs
          </p>
          <div className="pt-2">
            <h3 className="text-base sm:text-xl font-black text-blue-900 print:text-black uppercase">
              {isMasterView
                ? "Official Master Examination Timetable (General Notice Board Roster)"
                : `${activeDepartment?.name || "Academic"} (${selectedLevel}) Examination Timetable`}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">
              {activeTimetable?.title || "Examination Timetable"} &bull; Session: {activeTimetable?.session} ({activeTimetable?.semester})
              {selectedHall !== "ALL" && ` • Venue: ${selectedHall}`}
            </p>
          </div>
        </div>

        {/* Timetable Content */}
        {loading || loadingExams ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading examination schedule...</div>
        ) : filteredExams.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            {searchTerm
              ? `No examination papers matching "${searchTerm}".`
              : "No examination papers scheduled for the selected view."}
          </div>
        ) : groupByDate ? (
          /* Day-by-Day Notice Board View */
          <div className="space-y-8">
            {Object.entries(examsByDate).map(([dateStr, dateExams]) => {
              const formattedDate = new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              return (
                <div key={dateStr} className="space-y-3">
                  <div className="flex items-center space-x-3 bg-blue-900 text-white px-4 py-2 rounded-xl print:bg-slate-200 print:text-black">
                    <CalendarIcon className="w-4 h-4 text-amber-300 print:text-black shrink-0" />
                    <span className="font-black text-xs sm:text-sm tracking-wide uppercase">
                      {formattedDate} ({dateStr}) &mdash; {dateExams.length} {dateExams.length === 1 ? "Paper" : "Papers"}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-300 text-sm print:text-xs border border-slate-300">
                      <thead className="bg-slate-100 text-slate-900 font-bold text-left print:bg-slate-150">
                        <tr>
                          <th className="px-3.5 py-2.5 border border-slate-300 w-32">Period (Time)</th>
                          <th className="px-3.5 py-2.5 border border-slate-300 w-28">Course Code</th>
                          <th className="px-3.5 py-2.5 border border-slate-300">Course Title</th>
                          <th className="px-3.5 py-2.5 border border-slate-300 w-32">Offering Class</th>
                          <th className="px-3.5 py-2.5 border border-slate-300 w-36">Hall Venue</th>
                          <th className="px-3.5 py-2.5 border border-slate-300 text-center w-24">Students</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {dateExams.map((item, idx) => {
                          const deptCode = item.courses?.classes?.departments?.code || "DEPT";
                          const level = item.courses?.classes?.level || "";
                          const className = `${deptCode} ${level}`;

                          return (
                            <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                              <td className="px-3.5 py-2.5 font-mono font-bold text-slate-800 whitespace-nowrap border border-slate-300">
                                {item.start_time?.slice(0, 5)} &ndash; {item.end_time?.slice(0, 5)}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-black text-blue-900 print:text-black whitespace-nowrap border border-slate-300">
                                {item.courses?.code}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-900 font-medium border border-slate-300">
                                {item.courses?.title}
                              </td>
                              <td className="px-3.5 py-2.5 whitespace-nowrap border border-slate-300">
                                <span className="px-2 py-0.5 bg-slate-100 print:bg-transparent text-slate-900 rounded font-bold text-xs">
                                  {className}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap border border-slate-300">
                                {item.halls?.name}
                              </td>
                              <td className="px-3.5 py-2.5 text-center font-mono font-bold text-slate-800 border border-slate-300">
                                {item.courses?.classes?.student_count || 0}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Flat Table View */
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-300 text-sm print:text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-900 font-bold text-left print:bg-slate-200">
                <tr>
                  <th className="px-4 py-3 border border-slate-300">Date</th>
                  <th className="px-4 py-3 border border-slate-300">Period (Time)</th>
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

                  return (
                    <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                      <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap border border-slate-300">
                        {item.exam_date}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-800 whitespace-nowrap border border-slate-300">
                        {item.start_time?.slice(0, 5)} &ndash; {item.end_time?.slice(0, 5)}
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
        )}

        {/* Print Footer / Official Committee Endorsement */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-6 text-xs text-slate-700 border-t border-slate-400">
          <div className="text-left space-y-1">
            <p className="font-bold">Instructions to Candidates &amp; Invigilators:</p>
            <p>1. Candidates must arrive at their designated examination hall 30 minutes before the scheduled time.</p>
            <p>2. Presentation of a valid student identity card and examination clearance card is strictly mandatory.</p>
            <p>3. No mobile phones, smartwatches, or unauthorized study materials are permitted in the halls.</p>
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
