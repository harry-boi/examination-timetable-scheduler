"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { checkAllConflicts } from "@/lib/conflicts";
import { getExamPeriod, formatPeriodRange } from "@/lib/timeUtils";
import {
  CalendarIcon,
  ClockIcon,
  BuildingIcon,
  AlertTriangleIcon,
  SparklesIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PrinterIcon,
  SearchIcon,
  PolyLogo,
} from "@/components/Icons";

export default function TimetableDetailPage({ params }) {
  const unwrappedParams = use(params);
  const timetableId = unwrappedParams.id;

  const [timetable, setTimetable] = useState(null);
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [halls, setHalls] = useState([]);
  const [settings, setSettings] = useState({ max_classes_per_hall: 3 });
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterHall, setFilterHall] = useState("ALL");
  const [filterClass, setFilterClass] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deletingExam, setDeletingExam] = useState(null);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedHallId, setSelectedHallId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("12:00");

  // Conflict warning confirmation modal
  const [conflictWarningModal, setConflictWarningModal] = useState(null);

  // Suggest Timetable Modal state (Phase 8)
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestStartDate, setSuggestStartDate] = useState("");
  const [suggestEndDate, setSuggestEndDate] = useState("");
  const [suggestPeriods, setSuggestPeriods] = useState([
    { start: "09:00", end: "12:00" }, // Morning period
    { start: "13:00", end: "16:00" }, // Afternoon period
  ]);
  const [suggestions, setSuggestions] = useState(null);
  const [unplacedCourses, setUnplacedCourses] = useState([]);

  // Alerts
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const normalizeExam = (e) => {
    const deptCode = e.courses?.classes?.departments?.code || "";
    const level = e.courses?.classes?.level || "";
    const className = deptCode && level ? `${deptCode} ${level}` : "Unknown Class";

    return {
      id: e.id,
      course_id: e.course_id,
      course: e.courses?.code || "Course",
      course_title: e.courses?.title || "",
      class: className,
      class_id: e.courses?.class_id,
      student_count: e.courses?.classes?.student_count || 0,
      hall: e.halls?.name || "Hall",
      hall_id: e.hall_id,
      hall_capacity: e.halls?.capacity ?? null,
      date: e.exam_date,
      start_time: e.start_time?.slice(0, 5) || e.start_time,
      end_time: e.end_time?.slice(0, 5) || e.end_time,
    };
  };

  const fetchData = async () => {
    setLoading(true);

    const { data: ttData, error: ttErr } = await supabase
      .from("timetables")
      .select("*")
      .eq("id", timetableId)
      .single();

    if (ttErr) {
      setErrorMessage("Failed to load timetable: " + ttErr.message);
      setLoading(false);
      return;
    }
    setTimetable(ttData);

    const { data: setData } = await supabase.from("settings").select("*").limit(1).single();
    if (setData) setSettings(setData);

    const { data: crsData } = await supabase
      .from("courses")
      .select("id, code, title, class_id, classes(id, level, student_count, departments(name, code))")
      .order("code", { ascending: true });
    setCourses(crsData || []);
    if (crsData?.length && !selectedCourseId) {
      setSelectedCourseId(crsData[0].id);
    }

    const { data: hlsData } = await supabase
      .from("halls")
      .select("*")
      .order("name", { ascending: true });
    setHalls(hlsData || []);
    if (hlsData?.length && !selectedHallId) {
      setSelectedHallId(hlsData[0].id);
    }

    const { data: exData, error: exErr } = await supabase
      .from("exams")
      .select("*, courses(id, code, title, class_id, classes(id, level, student_count, departments(name, code))), halls(id, name, capacity)")
      .eq("timetable_id", timetableId)
      .order("exam_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (exErr) {
      setErrorMessage("Failed to load scheduled papers: " + exErr.message);
    } else {
      setExams(exData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [timetableId]);

  const normalizedExams = exams.map(normalizeExam);
  const activeConflicts = checkAllConflicts(normalizedExams, {
    maxClassesPerHall: settings.max_classes_per_hall || 3,
  });

  const conflictingExamIds = new Set();
  activeConflicts.forEach((conflict) => {
    conflict.entries?.forEach((entry) => {
      if (entry.id) conflictingExamIds.add(entry.id);
    });
  });

  // Unique classes for filtering
  const distinctClassOptions = Array.from(
    new Set(normalizedExams.map((e) => e.class).filter(Boolean))
  ).sort();

  // Filtered examination list
  const displayedExams = exams.filter((item) => {
    const normalized = normalizeExam(item);

    if (filterHall !== "ALL" && item.hall_id !== filterHall) {
      return false;
    }
    if (filterClass !== "ALL" && normalized.class !== filterClass) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const codeMatch = normalized.course.toLowerCase().includes(q);
      const titleMatch = normalized.course_title.toLowerCase().includes(q);
      const hallMatch = normalized.hall.toLowerCase().includes(q);
      const classMatch = normalized.class.toLowerCase().includes(q);
      return codeMatch || titleMatch || hallMatch || classMatch;
    }
    return true;
  });

  const openAddModal = () => {
    setEditingExam(null);
    setSelectedCourseId(courses[0]?.id || "");
    setSelectedHallId(halls[0]?.id || "");
    setExamDate(examDate || new Date().toISOString().split("T")[0]);
    setStartTime("09:00");
    setEndTime("12:00");
    setErrorMessage("");
    setShowModal(true);
  };

  const openEditModal = (exam) => {
    setEditingExam(exam);
    setSelectedCourseId(exam.course_id);
    setSelectedHallId(exam.hall_id);
    setExamDate(exam.exam_date);
    setStartTime(exam.start_time?.slice(0, 5) || "09:00");
    setEndTime(exam.end_time?.slice(0, 5) || "11:30");
    setErrorMessage("");
    setShowModal(true);
  };

  const validateAndSaveExam = async (overrideConfirmed = false) => {
    setErrorMessage("");

    if (!selectedCourseId) {
      setErrorMessage("Please select a course to schedule.");
      return;
    }
    if (!selectedHallId) {
      setErrorMessage("Please select an examination hall.");
      return;
    }
    if (!examDate) {
      setErrorMessage("Please choose an examination date.");
      return;
    }
    if (!startTime || !endTime) {
      setErrorMessage("Please specify both start time and end time.");
      return;
    }
    if (startTime >= endTime) {
      setErrorMessage("End time must be after start time.");
      return;
    }

    const selectedCourse = courses.find((c) => c.id === selectedCourseId);
    const selectedHall = halls.find((h) => h.id === selectedHallId);

    const deptCode = selectedCourse?.classes?.departments?.code || "";
    const level = selectedCourse?.classes?.level || "";
    const className = deptCode && level ? `${deptCode} ${level}` : "Unknown Class";

    const candidateEntry = {
      id: editingExam ? editingExam.id : "new-candidate",
      course_id: selectedCourseId,
      course: selectedCourse?.code || "Course",
      course_title: selectedCourse?.title || "",
      class: className,
      class_id: selectedCourse?.class_id,
      student_count: selectedCourse?.classes?.student_count || 0,
      hall: selectedHall?.name || "Hall",
      hall_id: selectedHallId,
      hall_capacity: selectedHall?.capacity ?? null,
      date: examDate,
      start_time: startTime,
      end_time: endTime,
    };

    const testList = editingExam
      ? normalizedExams.map((e) => (e.id === editingExam.id ? candidateEntry : e))
      : [...normalizedExams, candidateEntry];

    const candidateConflicts = checkAllConflicts(testList, {
      maxClassesPerHall: settings.max_classes_per_hall || 3,
    });

    const relevantConflicts = candidateConflicts.filter((c) =>
      c.entries?.some((e) => e.id === candidateEntry.id || e.course_id === candidateEntry.course_id)
    );

    // Hard block on duplicate courses
    const duplicateConflict = relevantConflicts.find((c) => c.type === "DUPLICATE_COURSE");
    if (duplicateConflict) {
      setErrorMessage(
        `Saving Blocked: Course "${candidateEntry.course}" is already scheduled in this timetable. Each course can only appear once.`
      );
      return;
    }

    // Confirmation for allowable conflicts
    if (relevantConflicts.length > 0 && !overrideConfirmed) {
      setConflictWarningModal({
        conflicts: relevantConflicts,
        onConfirm: () => {
          setConflictWarningModal(null);
          validateAndSaveExam(true);
        },
      });
      return;
    }

    setSubmitting(true);

    if (editingExam) {
      const { error } = await supabase
        .from("exams")
        .update({
          course_id: selectedCourseId,
          hall_id: selectedHallId,
          exam_date: examDate,
          start_time: startTime,
          end_time: endTime,
        })
        .eq("id", editingExam.id);

      if (error) {
        setErrorMessage("Failed to update exam entry: " + error.message);
      } else {
        setSuccessMessage(`Exam paper "${candidateEntry.course}" updated.`);
        setShowModal(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from("exams").insert([
        {
          timetable_id: timetableId,
          course_id: selectedCourseId,
          hall_id: selectedHallId,
          exam_date: examDate,
          start_time: startTime,
          end_time: endTime,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          setErrorMessage(`Course "${candidateEntry.course}" is already scheduled in this timetable.`);
        } else {
          setErrorMessage("Failed to schedule exam: " + error.message);
        }
      } else {
        setSuccessMessage(`Exam paper "${candidateEntry.course}" scheduled successfully.`);
        setShowModal(false);
        fetchData();
      }
    }

    setSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!deletingExam) return;
    setSubmitting(true);

    const { error } = await supabase.from("exams").delete().eq("id", deletingExam.id);

    if (error) {
      setErrorMessage("Failed to remove exam: " + error.message);
    } else {
      setSuccessMessage("Exam paper removed from timetable.");
      setDeletingExam(null);
      fetchData();
    }
    setSubmitting(false);
  };

  // Auto-Scheduler Algorithm
  const runAutoScheduler = () => {
    if (!suggestStartDate || !suggestEndDate) {
      setErrorMessage("Please select both a start date and an end date for scheduling.");
      return;
    }

    const scheduledCourseIds = new Set(exams.map((e) => e.course_id));
    const unscheduled = courses.filter((c) => !scheduledCourseIds.has(c.id));

    if (unscheduled.length === 0) {
      setErrorMessage("All catalog courses are already placed in this timetable.");
      return;
    }

    const dates = [];
    let cur = new Date(suggestStartDate);
    const end = new Date(suggestEndDate);
    while (cur <= end) {
      if (cur.getDay() !== 0) {
        dates.push(cur.toISOString().split("T")[0]);
      }
      cur.setDate(cur.getDate() + 1);
    }

    if (dates.length === 0) {
      setErrorMessage("No valid dates found in the chosen date range.");
      return;
    }

    const newSuggestions = [];
    const unplaced = [];
    let runningSchedule = [...normalizedExams];

    for (const crs of unscheduled) {
      const deptCode = crs.classes?.departments?.code || "";
      const level = crs.classes?.level || "";
      const className = deptCode && level ? `${deptCode} ${level}` : "Unknown Class";

      let placed = false;

      outerLoop:
      for (const d of dates) {
        for (const period of suggestPeriods) {
          for (const h of halls) {
            const candidate = {
              id: `suggest-${crs.id}`,
              course_id: crs.id,
              course: crs.code,
              course_title: crs.title,
              class: className,
              class_id: crs.class_id,
              student_count: crs.classes?.student_count || 0,
              hall: h.name,
              hall_id: h.id,
              hall_capacity: h.capacity ?? null,
              date: d,
              start_time: period.start,
              end_time: period.end,
            };

            const testList = [...runningSchedule, candidate];
            const candidateConflicts = checkAllConflicts(testList, {
              maxClassesPerHall: settings.max_classes_per_hall || 3,
            });

            const hasConflict = candidateConflicts.some((c) =>
              c.entries?.some((e) => e.id === candidate.id)
            );

            if (!hasConflict) {
              runningSchedule.push(candidate);
              newSuggestions.push(candidate);
              placed = true;
              break outerLoop;
            }
          }
        }
      }

      if (!placed) {
        unplaced.push({
          course: crs,
          reason: "No available conflict-free hall or period found in range.",
        });
      }
    }

    setSuggestions(newSuggestions);
    setUnplacedCourses(unplaced);
  };

  const acceptAndSaveSuggestions = async () => {
    if (!suggestions || suggestions.length === 0) return;
    setSubmitting(true);
    setErrorMessage("");

    const recordsToInsert = suggestions.map((s) => ({
      timetable_id: timetableId,
      course_id: s.course_id,
      hall_id: s.hall_id,
      exam_date: s.date,
      start_time: s.start_time,
      end_time: s.end_time,
    }));

    const { error } = await supabase.from("exams").insert(recordsToInsert);

    if (error) {
      setErrorMessage("Failed to save suggested entries: " + error.message);
    } else {
      setSuccessMessage(`Successfully committed ${suggestions.length} scheduled exam papers!`);
      setShowSuggestModal(false);
      setSuggestions(null);
      setUnplacedCourses([]);
      fetchData();
    }
    setSubmitting(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading timetable builder...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card (Hidden on print) */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1.5 font-medium">
            <Link href="/admin/timetables" className="hover:text-blue-900 transition flex items-center space-x-1">
              <span>&larr;</span>
              <span>All Timetables</span>
            </Link>
            <span>&bull;</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">{timetable?.session}</span>
            <span>&bull;</span>
            <span className="font-bold text-blue-900 px-2 py-0.5 bg-blue-50 rounded border border-blue-200/60">
              {timetable?.semester}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {timetable?.title}
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto justify-center px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-1.5 shadow-2xs"
            title="Print Official Timetable Roster"
          >
            <PrinterIcon className="w-4 h-4 text-blue-900" />
            <span>Print Timetable</span>
          </button>
          <button
            onClick={() => setShowSuggestModal(true)}
            className="w-full sm:w-auto justify-center px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-900 border border-indigo-200/80 rounded-xl text-xs sm:text-sm font-bold transition flex items-center space-x-1.5 shadow-2xs"
          >
            <SparklesIcon className="w-4 h-4 text-indigo-600" />
            <span>Suggest Timetable</span>
          </button>
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto justify-center px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center space-x-1.5"
          >
            <PlusIcon className="w-4 h-4 text-amber-300" />
            <span>Add Exam Entry</span>
          </button>
        </div>
      </div>

      {/* Alert Messages (Hidden on print) */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl text-sm flex justify-between items-center shadow-xs print:hidden">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="font-bold ml-4 hover:opacity-75">&times;</button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-sm flex justify-between items-center shadow-xs print:hidden">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="font-bold ml-4 hover:opacity-75">&times;</button>
        </div>
      )}

      {/* Red Panel: Real-Time Conflict Alerts (Hidden on print) */}
      {activeConflicts.length > 0 && (
        <div
          role="alert"
          className="bg-rose-50 border-2 border-rose-400/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3 animate-in fade-in print:hidden"
        >
          <div className="flex items-center space-x-2 text-rose-950 font-black">
            <AlertTriangleIcon className="w-6 h-6 text-rose-600 animate-bounce" />
            <span className="text-base sm:text-lg">
              Scheduling Conflicts Detected ({activeConflicts.length}) &mdash; Action Required
            </span>
          </div>
          <div className="space-y-2.5 pt-1">
            {activeConflicts.map((c, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-white rounded-xl border border-rose-200/90 text-xs sm:text-sm text-rose-950 shadow-2xs"
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-mono font-bold text-[11px] uppercase px-2 py-0.5 bg-rose-100 text-rose-900 border border-rose-300 rounded">
                    {c.type}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{c.date || "Timetable"}</span>
                </div>
                <p className="leading-relaxed font-medium">{c.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official Printable Header (Visible ONLY on print) */}
      <div className="hidden print:block text-center pb-6 border-b-2 border-slate-900 mb-6 space-y-1.5">
        <div className="inline-flex justify-center mb-1">
          <PolyLogo className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-black uppercase text-slate-900 tracking-wide">
          Akwa Ibom State Polytechnic
        </h2>
        <p className="text-sm font-bold uppercase text-slate-700">
          Ikot Osurua, Ikot Ekpene, Akwa Ibom State
        </p>
        <p className="text-xs uppercase text-slate-600 font-semibold tracking-wider">
          Time Table and Class Allocation Committee &bull; Directorate of Academic Affairs
        </p>
        <div className="pt-2">
          <h3 className="text-lg font-black text-black">
            {timetable?.title}
          </h3>
          <p className="text-sm font-bold text-slate-800">
            Academic Session: {timetable?.session} &bull; {timetable?.semester}
            {filterHall !== "ALL" && ` • Hall Filter: ${halls.find(h => h.id === filterHall)?.name}`}
            {filterClass !== "ALL" && ` • Class Filter: ${filterClass}`}
          </p>
        </div>
      </div>

      {/* Timetable Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden print:border-none print:shadow-none">
        {/* Table Toolbar & View Filter (Hidden on print) */}
        <div className="p-5 sm:p-6 border-b border-slate-200/90 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 print:hidden">
          <div className="flex items-center space-x-3">
            <h2 className="font-bold text-slate-900 text-base">
              Scheduled Papers ({displayedExams.length}{displayedExams.length !== exams.length ? ` of ${exams.length}` : ""})
            </h2>
            {activeConflicts.length === 0 && exams.length > 0 && (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-full text-xs font-bold">
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Conflict-Free</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full lg:w-auto lg:flex lg:items-center">
            {/* Filter by Hall */}
            <select
              value={filterHall}
              onChange={(e) => setFilterHall(e.target.value)}
              className="w-full lg:w-auto px-3 py-2 border border-slate-300 rounded-xl text-sm sm:text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">All Halls ({halls.length})</option>
              {halls.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            {/* Filter by Class */}
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full lg:w-auto px-3 py-2 border border-slate-300 rounded-xl text-sm sm:text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">All Classes ({distinctClassOptions.length})</option>
              {distinctClassOptions.map((cName) => (
                <option key={cName} value={cName}>
                  {cName}
                </option>
              ))}
            </select>

            {/* Quick Search */}
            <div className="relative w-full lg:w-auto">
              <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code, venue, class..."
                className="w-full lg:w-48 pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm sm:text-xs focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
          </div>
        </div>

        {exams.length === 0 ? (
          <div className="p-8 sm:p-12 text-center text-slate-500 text-sm space-y-3">
            <p className="font-medium text-slate-600">No examination papers scheduled yet.</p>
            <p className="text-xs text-slate-400">
              Use <strong>+ Add Exam Entry</strong> to schedule individual papers, or click <strong>✨ Suggest Timetable</strong> to automatically generate conflict-free allocations.
            </p>
          </div>
        ) : displayedExams.length === 0 ? (
          <div className="p-8 sm:p-10 text-center text-slate-500 text-sm">
            No examination papers match the current filters.
          </div>
        ) : (
          <>
            {/* Mobile Cards View (Visible on screens < 768px, hidden on desktop and print) */}
            <div className="block md:hidden divide-y divide-slate-100 print:hidden">
              {displayedExams.map((item) => {
                const isConflicting = conflictingExamIds.has(item.id);
                const deptCode = item.courses?.classes?.departments?.code || "DEPT";
                const level = item.courses?.classes?.level || "";
                const className = `${deptCode} ${level}`;
                const period = getExamPeriod(item.start_time);
                const time12 = formatPeriodRange(item.start_time, item.end_time);

                return (
                  <div
                    key={item.id}
                    className={`p-4 sm:p-5 space-y-3 transition-colors ${
                      isConflicting ? "bg-rose-50/70 border-l-4 border-rose-600" : "hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-blue-900 text-base">
                            {item.courses?.code}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-bold text-xs">
                            {className}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 mt-1">
                          {item.courses?.title}
                        </h4>
                      </div>
                      {isConflicting && (
                        <span className="shrink-0 inline-flex items-center space-x-1 text-[10px] font-black uppercase text-rose-700 bg-rose-100/90 px-2 py-0.5 rounded">
                          <span>⚠️ Conflict</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="p-2.5 bg-slate-50/80 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Date &amp; Time</span>
                        <div className="font-bold text-slate-900 flex items-center space-x-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                          <span>{item.exam_date}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 pt-0.5">
                          <span className={`inline-flex items-center space-x-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${period.badgeClass}`}>
                            <span>{period.icon}</span>
                            <span>{period.name}</span>
                          </span>
                          <span className="font-mono font-bold text-slate-800 text-[11px]">{time12}</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50/80 rounded-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Venue &amp; Students</span>
                        <div className="font-bold text-slate-900 flex items-center space-x-1 truncate">
                          <BuildingIcon className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                          <span className="truncate">{item.halls?.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium">
                          Headcount: <span className="font-mono font-bold text-slate-900">{item.courses?.classes?.student_count || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => openEditModal(item)}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        <EditIcon className="w-3.5 h-3.5" />
                        <span>Edit Entry</span>
                      </button>
                      <button
                        onClick={() => setDeletingExam(item)}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop & Print Table View */}
            <div className="hidden md:block print:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm print:text-xs border border-slate-300">
                <thead className="bg-slate-50/70 text-slate-600 font-bold text-left text-xs uppercase tracking-wider print:bg-slate-200 print:text-black">
                  <tr>
                    <th className="px-4 py-3 border border-slate-300">Date</th>
                    <th className="px-4 py-3 border border-slate-300">Period (Time)</th>
                    <th className="px-4 py-3 border border-slate-300">Course Code</th>
                    <th className="px-4 py-3 border border-slate-300">Course Title</th>
                    <th className="px-4 py-3 border border-slate-300">Offering Class</th>
                    <th className="px-4 py-3 border border-slate-300">Hall Venue</th>
                    <th className="px-4 py-3 border border-slate-300 text-center">Students</th>
                    <th className="px-4 py-3 text-right print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayedExams.map((item, idx) => {
                    const isConflicting = conflictingExamIds.has(item.id);
                    const deptCode = item.courses?.classes?.departments?.code || "DEPT";
                    const level = item.courses?.classes?.level || "";
                    const className = `${deptCode} ${level}`;

                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors ${
                          isConflicting
                            ? "bg-rose-50/70 hover:bg-rose-100/60 border-l-4 border-rose-600 print:border-l-0"
                            : idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap border border-slate-300">
                          <div className="font-bold text-slate-900">{item.exam_date}</div>
                          {isConflicting && (
                            <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase text-rose-700 bg-rose-100/90 px-1.5 py-0.5 rounded mt-1 print:hidden">
                              <span>⚠️ Conflict</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap border border-slate-300">
                          {(() => {
                            const period = getExamPeriod(item.start_time);
                            const time12 = formatPeriodRange(item.start_time, item.end_time);
                            return (
                              <div className="space-y-1">
                                <span className={`inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${period.badgeClass}`}>
                                  <span>{period.icon}</span>
                                  <span>{period.name}</span>
                                </span>
                                <div className="font-mono text-xs font-bold text-slate-800">
                                  {time12}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono print:hidden">
                                  {item.start_time?.slice(0, 5)} &ndash; {item.end_time?.slice(0, 5)}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 font-mono font-black text-blue-900 print:text-black whitespace-nowrap border border-slate-300">
                          {item.courses?.code}
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-medium border border-slate-300">
                          {item.courses?.title}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap border border-slate-300">
                          <span className="px-2 py-0.5 bg-slate-100 print:bg-transparent text-slate-800 rounded font-bold text-xs">
                            {className}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-slate-900 border border-slate-300">
                          {item.halls?.name}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800 text-center border border-slate-300">
                          {item.courses?.classes?.student_count || 0}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap print:hidden">
                          <button
                            onClick={() => openEditModal(item)}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingExam(item)}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Official Print Footer / Committee Endorsements (Visible ONLY on print) */}
              <div className="hidden print:flex justify-between items-end mt-12 pt-6 text-xs text-slate-700 border-t border-slate-400">
                <div className="text-left space-y-1">
                  <p className="font-bold">Important Instructions for Hall Invigilators:</p>
                  <p>1. Invigilators must ensure admission of authorized students only matching their enrolled class list.</p>
                  <p>2. Report any venue seating capacity irregularities directly to the committee secretariat.</p>
                </div>
                <div className="text-right space-y-10">
                  <div>___________________________________________________</div>
                  <div className="font-bold">Chairman, Time Table &amp; Class Allocation Committee</div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <PlusIcon className="w-5 h-5 text-blue-900" />
              <span>{editingExam ? "Edit Examination Entry" : "Schedule Examination Paper"}</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Course to Schedule
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
                >
                  {courses.map((c) => {
                    const dept = c.classes?.departments?.code || "DEPT";
                    const lvl = c.classes?.level || "";
                    return (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.title} ({dept} {lvl}, {c.classes?.student_count || 0} students)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Examination Hall Venue
                </label>
                <select
                  value={selectedHallId}
                  onChange={(e) => setSelectedHallId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
                >
                  {halls.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} {h.capacity ? `(Capacity: ${h.capacity})` : "(No capacity limit)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
                />
              </div>

              {/* Morning / Afternoon Quick Preset Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Exam Period / Session
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStartTime("09:00");
                      setEndTime("12:00");
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col ${
                      startTime === "09:00" && endTime === "12:00"
                        ? "border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-400/40 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="font-bold text-xs flex items-center space-x-1.5">
                      <span>☀️</span>
                      <span>Morning Session</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5">9:00 AM &ndash; 12:00 PM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStartTime("13:00");
                      setEndTime("16:00");
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col ${
                      startTime === "13:00" && endTime === "16:00"
                        ? "border-indigo-500 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-400/40 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="font-bold text-xs flex items-center space-x-1.5">
                      <span>🌤️</span>
                      <span>Afternoon Session</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5">1:00 PM &ndash; 4:00 PM</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => validateAndSaveExam(false)}
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white rounded-xl text-sm font-bold transition shadow-xs text-center"
                >
                  {submitting ? "Validating & Saving..." : "Save Exam Entry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Confirmation Modal */}
      {conflictWarningModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-rose-300 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-black text-rose-950 flex items-center space-x-2">
              <AlertTriangleIcon className="w-5 h-5 text-rose-600" />
              <span>Potential Timetable Conflict Detected</span>
            </h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              The proposed schedule triggers the following conflict alert(s):
            </p>
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {conflictWarningModal.conflicts.map((c, i) => (
                <div key={i} className="p-3 bg-rose-50 text-rose-950 text-xs rounded-xl border border-rose-200">
                  <span className="font-bold uppercase font-mono mr-1.5">{c.type}:</span>
                  <span>{c.message}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500 italic">
              Note: The timetable committee may occasionally accept a shared hall on purpose.
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setConflictWarningModal(null)}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition text-center"
              >
                Cancel &amp; Adjust
              </button>
              <button
                type="button"
                onClick={conflictWarningModal.onConfirm}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-sm font-bold transition shadow-xs text-center"
              >
                Confirm &amp; Save Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggest Timetable Assistant Modal (Phase 8) */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl shrink-0">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">Automatic Timetable Scheduler</h3>
                <p className="text-xs text-slate-500">
                  Computes valid dates, periods, and venues for unscheduled courses causing zero conflicts.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Exam Start Date
                  </label>
                  <input
                    type="date"
                    value={suggestStartDate}
                    onChange={(e) => setSuggestStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Exam End Date
                  </label>
                  <input
                    type="date"
                    value={suggestEndDate}
                    onChange={(e) => setSuggestEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={runAutoScheduler}
                  className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-xs flex items-center justify-center space-x-2"
                >
                  <SparklesIcon className="w-4 h-4 text-amber-300" />
                  <span>Generate Conflict-Free Allocations</span>
                </button>
              </div>

              {suggestions && (
                <div className="mt-6 space-y-4 border-t border-slate-200 pt-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">
                      Proposed Suggestions ({suggestions.length} courses placed)
                    </h4>
                    {suggestions.length > 0 && (
                      <button
                        onClick={acceptAndSaveSuggestions}
                        disabled={submitting}
                        className="w-full sm:w-auto px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        <span>{submitting ? "Saving All..." : "Accept & Commit Suggestions"}</span>
                      </button>
                    )}
                  </div>

                  {suggestions.length === 0 ? (
                    <p className="text-sm text-slate-500">No new courses were placed.</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                      {suggestions.map((s, idx) => (
                        <div key={idx} className="p-3 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 bg-slate-50/50">
                          <div>
                            <span className="font-extrabold text-blue-900 font-mono mr-2">{s.course}</span>
                            <span className="text-slate-600 font-medium">{s.class}</span>
                          </div>
                          <div className="font-mono text-slate-700 text-[11px] sm:text-xs">
                            {s.date} &bull; {s.start_time} - {s.end_time} &bull; <strong>{s.hall}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {unplacedCourses.length > 0 && (
                    <div className="p-3.5 bg-amber-50 text-amber-950 border border-amber-200 rounded-xl text-xs space-y-1">
                      <p className="font-bold">Unplaced Courses ({unplacedCourses.length}):</p>
                      {unplacedCourses.map((u, i) => (
                        <p key={i}>
                          &bull; <strong>{u.course.code}</strong>: {u.reason}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowSuggestModal(false)}
                  className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Exam Modal */}
      {deletingExam && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">Remove Exam Paper</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900 font-semibold">
                "{deletingExam.courses?.code} - {deletingExam.courses?.title}"
              </strong>{" "}
              from this timetable?
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setDeletingExam(null)}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition shadow-xs text-center"
              >
                {submitting ? "Removing..." : "Yes, Remove Paper"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
