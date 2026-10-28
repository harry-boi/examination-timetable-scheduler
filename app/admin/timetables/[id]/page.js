"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { checkAllConflicts, getCourseCode, getClassName, getHallName } from "@/lib/conflicts";

export default function TimetableDetailPage({ params }) {
  const unwrappedParams = use(params);
  const timetableId = unwrappedParams.id;

  const [timetable, setTimetable] = useState(null);
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [halls, setHalls] = useState([]);
  const [settings, setSettings] = useState({ max_classes_per_hall: 3 });
  const [loading, setLoading] = useState(true);

  // Form states
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deletingExam, setDeletingExam] = useState(null);

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedHallId, setSelectedHallId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:30");

  // Conflict warning confirmation modal
  const [conflictWarningModal, setConflictWarningModal] = useState(null);

  // Suggest Timetable Modal state (Phase 8)
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestStartDate, setSuggestStartDate] = useState("");
  const [suggestEndDate, setSuggestEndDate] = useState("");
  const [suggestPeriods, setSuggestPeriods] = useState([
    { start: "08:30", end: "11:30" },
    { start: "12:30", end: "15:30" },
  ]);
  const [suggestions, setSuggestions] = useState(null);
  const [unplacedCourses, setUnplacedCourses] = useState([]);

  // Alerts
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  // Helper to normalize an exam into the format needed by lib/conflicts.js
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

    // 1. Fetch Timetable
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

    // 2. Fetch Settings
    const { data: setData } = await supabase.from("settings").select("*").limit(1).single();
    if (setData) setSettings(setData);

    // 3. Fetch Courses with class and department
    const { data: crsData } = await supabase
      .from("courses")
      .select("id, code, title, class_id, classes(id, level, student_count, departments(name, code))")
      .order("code", { ascending: true });
    setCourses(crsData || []);
    if (crsData?.length && !selectedCourseId) {
      setSelectedCourseId(crsData[0].id);
    }

    // 4. Fetch Halls
    const { data: hlsData } = await supabase
      .from("halls")
      .select("*")
      .order("name", { ascending: true });
    setHalls(hlsData || []);
    if (hlsData?.length && !selectedHallId) {
      setSelectedHallId(hlsData[0].id);
    }

    // 5. Fetch Exams
    const { data: exData, error: exErr } = await supabase
      .from("exams")
      .select("*, courses(id, code, title, class_id, classes(id, level, student_count, departments(name, code))), halls(id, name, capacity)")
      .eq("timetable_id", timetableId)
      .order("exam_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (exErr) {
      setErrorMessage("Failed to load exam entries: " + exErr.message);
    } else {
      setExams(exData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [timetableId]);

  // Compute live conflicts using lib/conflicts.js
  const normalizedExams = exams.map(normalizeExam);
  const activeConflicts = checkAllConflicts(normalizedExams, {
    maxClassesPerHall: settings.max_classes_per_hall || 3,
  });

  // Identify all exam IDs involved in conflicts to highlight them in red
  const conflictingExamIds = new Set();
  activeConflicts.forEach((conflict) => {
    conflict.entries?.forEach((entry) => {
      if (entry.id) conflictingExamIds.add(entry.id);
    });
  });

  const openAddModal = () => {
    setEditingExam(null);
    setSelectedCourseId(courses[0]?.id || "");
    setSelectedHallId(halls[0]?.id || "");
    setExamDate(examDate || new Date().toISOString().split("T")[0]);
    setStartTime("09:00");
    setEndTime("11:30");
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
      setErrorMessage("Please select a course.");
      return;
    }
    if (!selectedHallId) {
      setErrorMessage("Please select an examination hall.");
      return;
    }
    if (!examDate) {
      setErrorMessage("Please specify an examination date.");
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

    // Build candidate normalized entry to test conflicts
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

    // Construct hypothetical updated exams array
    const testList = editingExam
      ? normalizedExams.map((e) => (e.id === editingExam.id ? candidateEntry : e))
      : [...normalizedExams, candidateEntry];

    // Run conflict detection on the proposed list
    const candidateConflicts = checkAllConflicts(testList, {
      maxClassesPerHall: settings.max_classes_per_hall || 3,
    });

    // Check if the candidate entry causes or is part of any conflict
    const relevantConflicts = candidateConflicts.filter((c) =>
      c.entries?.some((e) => e.id === candidateEntry.id || e.course_id === candidateEntry.course_id)
    );

    // Rule: HARD BLOCK on duplicate courses!
    const duplicateConflict = relevantConflicts.find((c) => c.type === "DUPLICATE_COURSE");
    if (duplicateConflict) {
      setErrorMessage(
        `Saving Blocked: Course "${candidateEntry.course}" is already scheduled in this timetable. Each course can only appear once.`
      );
      return;
    }

    // If other conflicts exist (Class Clash or Hall Clash) and administrator hasn't explicitly confirmed:
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

    // Perform database save
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
        setSuccessMessage(`Exam paper for "${candidateEntry.course}" updated successfully.`);
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
          setErrorMessage(`Course "${candidateEntry.course}" already exists in this timetable.`);
        } else {
          setErrorMessage("Failed to schedule exam: " + error.message);
        }
      } else {
        setSuccessMessage(`Exam paper for "${candidateEntry.course}" scheduled successfully.`);
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
      setErrorMessage("Failed to delete exam: " + error.message);
    } else {
      setSuccessMessage("Exam paper removed from timetable.");
      setDeletingExam(null);
      fetchData();
    }
    setSubmitting(false);
  };

  // Phase 8: Automatic Scheduler Generator
  const runAutoScheduler = () => {
    if (!suggestStartDate || !suggestEndDate) {
      setErrorMessage("Please select both a start date and an end date for scheduling.");
      return;
    }

    // Find courses not yet scheduled in this timetable
    const scheduledCourseIds = new Set(exams.map((e) => e.course_id));
    const unscheduled = courses.filter((c) => !scheduledCourseIds.has(c.id));

    if (unscheduled.length === 0) {
      setErrorMessage("All available courses are already scheduled in this timetable.");
      return;
    }

    // Generate list of available dates (excluding Sundays)
    const dates = [];
    let cur = new Date(suggestStartDate);
    const end = new Date(suggestEndDate);
    while (cur <= end) {
      // 0 = Sunday
      if (cur.getDay() !== 0) {
        dates.push(cur.toISOString().split("T")[0]);
      }
      cur.setDate(cur.getDate() + 1);
    }

    if (dates.length === 0) {
      setErrorMessage("No valid dates found in the chosen date range.");
      return;
    }

    // Greedy slot placement causing zero conflicts
    const newSuggestions = [];
    const unplaced = [];
    let runningSchedule = [...normalizedExams];

    for (const crs of unscheduled) {
      const deptCode = crs.classes?.departments?.code || "";
      const level = crs.classes?.level || "";
      const className = deptCode && level ? `${deptCode} ${level}` : "Unknown Class";

      let placed = false;

      // Try every date, time period, and hall
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

            // If this candidate causes no conflicts whatsoever, accept slot
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
          reason: "No available conflict-free hall or time slot found in the provided date range.",
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
      setErrorMessage("Failed to save suggested timetable entries: " + error.message);
    } else {
      setSuccessMessage(`Successfully added ${suggestions.length} scheduled exam papers!`);
      setShowSuggestModal(false);
      setSuggestions(null);
      setUnplacedCourses([]);
      fetchData();
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 text-sm">Loading timetable builder...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <Link href="/admin/timetables" className="hover:underline">
              &larr; All Timetables
            </Link>
            <span>&bull;</span>
            <span>{timetable?.session}</span>
            <span>&bull;</span>
            <span className="font-semibold text-blue-900">{timetable?.semester}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{timetable?.title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowSuggestModal(true)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-semibold transition flex items-center space-x-1"
          >
            <span>✨</span>
            <span>Suggest Timetable</span>
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            + Add Exam Entry
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg text-sm flex justify-between items-center">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="font-bold ml-4">&times;</button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-sm flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="font-bold ml-4">&times;</button>
        </div>
      )}

      {/* Red Panel: Real-Time Conflict Alerts */}
      {activeConflicts.length > 0 && (
        <div
          role="alert"
          className="bg-red-50 border-2 border-red-400 rounded-xl p-5 shadow-sm space-y-3"
        >
          <div className="flex items-center space-x-2 text-red-900 font-bold">
            <span className="text-xl">⚠️</span>
            <span className="text-base">
              Conflicts Detected ({activeConflicts.length}) &mdash; Action Required
            </span>
          </div>
          <div className="space-y-2">
            {activeConflicts.map((c, idx) => (
              <div
                key={idx}
                className="p-3 bg-white/80 rounded-lg border border-red-200 text-sm text-red-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
              >
                <div>
                  <span className="font-bold text-xs uppercase px-2 py-0.5 bg-red-100 text-red-800 rounded mr-2">
                    {c.type}
                  </span>
                  <span>{c.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timetable Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">
            Scheduled Papers ({exams.length})
          </h2>
        </div>

        {exams.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No examination papers scheduled yet. Click <strong>+ Add Exam Entry</strong> or <strong>✨ Suggest Timetable</strong> to schedule papers.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Period (Time)</th>
                  <th className="px-6 py-3">Course</th>
                  <th className="px-6 py-3">Offering Class</th>
                  <th className="px-6 py-3">Hall Venue</th>
                  <th className="px-6 py-3">Students</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((item) => {
                  const isConflicting = conflictingExamIds.has(item.id);
                  const deptCode = item.courses?.classes?.departments?.code || "DEPT";
                  const level = item.courses?.classes?.level || "";
                  const className = `${deptCode} ${level}`;

                  return (
                    <tr
                      key={item.id}
                      className={`transition ${
                        isConflicting
                          ? "bg-red-50/80 hover:bg-red-100/70 border-l-4 border-red-600"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                        {item.exam_date}
                        {isConflicting && (
                          <span className="ml-2 text-xs font-bold text-red-600 uppercase">
                            [Clash]
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-700 whitespace-nowrap">
                        {item.start_time?.slice(0, 5)} &ndash; {item.end_time?.slice(0, 5)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-blue-900">
                          {item.courses?.code}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.courses?.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-xs">
                          {className}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        {item.halls?.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-700">
                        {item.courses?.classes?.student_count || 0}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => openEditModal(item)}
                          className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-semibold transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingExam(item)}
                          className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-semibold transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingExam ? "Edit Scheduled Exam Paper" : "Schedule Exam Paper"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Course to Schedule
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
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
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Examination Hall
                </label>
                <select
                  value={selectedHallId}
                  onChange={(e) => setSelectedHallId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  {halls.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} {h.capacity ? `(Capacity: ${h.capacity})` : "(No capacity limit)"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => validateAndSaveExam(false)}
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                >
                  {submitting ? "Checking & Saving..." : "Save Exam Entry"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conflict Confirmation Modal (for allowable hall sharing / class clashes) */}
      {conflictWarningModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-red-300">
            <h3 className="text-lg font-bold text-red-900 flex items-center space-x-2">
              <span>⚠️</span>
              <span>Potential Timetable Conflict Detected</span>
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              The proposed exam schedule triggers the following conflict warning(s):
            </p>
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {conflictWarningModal.conflicts.map((c, i) => (
                <div key={i} className="p-2.5 bg-red-50 text-red-900 text-xs rounded border border-red-200">
                  <strong>{c.type}:</strong> {c.message}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500 italic">
              Note: The timetable committee may occasionally accept a shared hall on purpose.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setConflictWarningModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel &amp; Adjust
              </button>
              <button
                type="button"
                onClick={conflictWarningModal.onConfirm}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-sm font-semibold transition"
              >
                Confirm &amp; Save Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suggest Timetable Assistant Modal (Phase 8) */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900">✨ Automatic Timetable Scheduler</h3>
            <p className="text-sm text-slate-600 mt-1">
              Automatically schedules unplaced courses across available dates, periods, and examination halls without generating any conflicts.
            </p>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Exam Start Date
                  </label>
                  <input
                    type="date"
                    value={suggestStartDate}
                    onChange={(e) => setSuggestStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Exam End Date
                  </label>
                  <input
                    type="date"
                    value={suggestEndDate}
                    onChange={(e) => setSuggestEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={runAutoScheduler}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                >
                  Generate Conflict-Free Suggestions
                </button>
              </div>

              {/* Suggestions Results */}
              {suggestions && (
                <div className="mt-6 space-y-4 border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm">
                      Proposed Suggestions ({suggestions.length} courses placed)
                    </h4>
                    {suggestions.length > 0 && (
                      <button
                        onClick={acceptAndSaveSuggestions}
                        disabled={submitting}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                      >
                        {submitting ? "Saving All..." : "Accept & Save Suggestions"}
                      </button>
                    )}
                  </div>

                  {suggestions.length === 0 ? (
                    <p className="text-sm text-slate-500">No new courses were placed.</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                      {suggestions.map((s, idx) => (
                        <div key={idx} className="p-3 text-xs flex justify-between items-center bg-slate-50/50">
                          <div>
                            <span className="font-bold text-blue-900 font-mono mr-2">{s.course}</span>
                            <span className="text-slate-600">{s.class}</span>
                          </div>
                          <div className="font-mono text-slate-700">
                            {s.date} &bull; {s.start_time} - {s.end_time} &bull; <strong>{s.hall}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {unplacedCourses.length > 0 && (
                    <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs space-y-1">
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
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Remove Exam Paper</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900 font-semibold">
                "{deletingExam.courses?.code} - {deletingExam.courses?.title}"
              </strong>{" "}
              from this timetable?
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingExam(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition"
              >
                {submitting ? "Removing..." : "Yes, Remove Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
