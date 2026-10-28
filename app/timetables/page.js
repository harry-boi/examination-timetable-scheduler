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
} from "@/components/Icons";

const POLY_LEVELS = ["ND 1", "ND 2", "HND 1", "HND 2"];

export default function PublicTimetablesPage() {
  const [timetables, setTimetables] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [selectedTimetableId, setSelectedTimetableId] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("ND 1");

  const [exams, setExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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
        if (deptData?.length > 0) {
          setSelectedDepartmentId(deptData[0].id);
        }
      }

      setLoading(false);
    };

    fetchMetadata();
  }, []);

  useEffect(() => {
    if (!selectedTimetableId || !selectedDepartmentId || !selectedLevel) {
      setExams([]);
      return;
    }

    const fetchClassExams = async () => {
      setLoadingExams(true);

      const { data, error } = await supabase
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
              departments (name, code)
            )
          )
        `)
        .eq("timetable_id", selectedTimetableId)
        .eq("courses.classes.department_id", selectedDepartmentId)
        .eq("courses.classes.level", selectedLevel)
        .order("exam_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        setErrorMessage("Failed to load class schedule: " + error.message);
      } else {
        setExams(data || []);
      }

      setLoadingExams(false);
    };

    fetchClassExams();
  }, [selectedTimetableId, selectedDepartmentId, selectedLevel]);

  const activeTimetable = timetables.find((t) => t.id === selectedTimetableId);
  const activeDepartment = departments.find((d) => d.id === selectedDepartmentId);
  const activeClassName = activeDepartment
    ? `${activeDepartment.code} ${selectedLevel}`
    : selectedLevel;

  const filteredExams = exams.filter((e) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const code = e.courses?.code?.toLowerCase() || "";
    const title = e.courses?.title?.toLowerCase() || "";
    const hall = e.halls?.name?.toLowerCase() || "";
    return code.includes(term) || title.includes(term) || hall.includes(term);
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Interactive Controls (Hidden during printing) */}
      <div className="print:hidden space-y-6">
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <CalendarIcon className="w-6 h-6 text-blue-900" />
              <span>Student &amp; Staff Examination Timetables</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Select your timetable, academic department, and level to inspect or print your official exam schedule.
            </p>
          </div>
          {exams.length > 0 && (
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center space-x-2 shrink-0"
            >
              <PrinterIcon className="w-4 h-4 text-amber-300" />
              <span>Print Timetable</span>
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="p-4 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl text-sm shadow-xs">
            {errorMessage}
          </div>
        )}

        {/* Filter Controls Card */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Timetable
            </label>
            <select
              value={selectedTimetableId}
              onChange={(e) => setSelectedTimetableId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
            >
              {timetables.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.session})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Class Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
            >
              {POLY_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Search Course Code
            </label>
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="e.g. SWD 422..."
                className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Timetable Document */}
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
            Time Table and Class Allocation Committee
          </p>
          <div className="pt-2">
            <h3 className="text-base sm:text-lg font-black text-blue-900 print:text-black">
              {activeTimetable?.title || "Examination Timetable"}
            </h3>
            <p className="text-xs sm:text-sm font-bold text-slate-800">
              Class: {activeClassName} &bull; Department of {activeDepartment?.name || "Academic Department"}
            </p>
          </div>
        </div>

        {/* Timetable Table */}
        {loading || loadingExams ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading examination schedule...</div>
        ) : filteredExams.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            {searchTerm
              ? `No examination papers matching "${searchTerm}".`
              : `No examination papers scheduled for ${activeClassName} in this timetable yet.`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-300 text-sm print:text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-900 font-bold text-left print:bg-slate-200">
                <tr>
                  <th className="px-4 py-3 border border-slate-300">Date</th>
                  <th className="px-4 py-3 border border-slate-300">Period (Time)</th>
                  <th className="px-4 py-3 border border-slate-300">Course Code</th>
                  <th className="px-4 py-3 border border-slate-300">Course Title</th>
                  <th className="px-4 py-3 border border-slate-300">Examination Hall</th>
                  <th className="px-4 py-3 border border-slate-300 text-center">Class / Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredExams.map((item, idx) => (
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
                    <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap border border-slate-300">
                      {item.halls?.name}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap font-mono text-slate-700 border border-slate-300">
                      {activeClassName} ({item.courses?.classes?.student_count || 0})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Print Footer / Official Committee Endorsement */}
            <div className="hidden print:flex justify-between items-end mt-12 pt-6 text-xs text-slate-700 border-t border-slate-300">
              <div className="text-left space-y-1">
                <p className="font-bold">Instructions to Candidates:</p>
                <p>1. Arrive at your allocated examination hall 30 minutes before the scheduled start time.</p>
                <p>2. Presentation of a valid Student Identity Card and Exam Clearance Slip is mandatory.</p>
              </div>
              <div className="text-right space-y-8">
                <div>__________________________________________</div>
                <div className="font-bold">Chairman, Time Table &amp; Class Allocation Committee</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
