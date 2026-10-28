"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { CalendarIcon, PlusIcon, TrashIcon, ArrowRightIcon } from "@/components/Icons";

export default function TimetablesListPage() {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [session, setSession] = useState("2025/2026");
  const [semester, setSemester] = useState("First Semester");
  const [deletingTimetable, setDeletingTimetable] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const fetchTimetables = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("timetables")
      .select("*, exams(count)")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage("Failed to load timetables: " + error.message);
    } else {
      setTimetables(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTimetables();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedTitle = title.trim();
    const trimmedSession = session.trim();

    if (!trimmedTitle) {
      setErrorMessage("Timetable title is required (e.g. 'ND 1 & HND 1 Examination Timetable').");
      return;
    }
    if (!trimmedSession) {
      setErrorMessage("Academic session is required (e.g. '2025/2026').");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from("timetables").insert([
      {
        title: trimmedTitle,
        session: trimmedSession,
        semester,
      },
    ]);

    if (error) {
      setErrorMessage("Failed to create timetable: " + error.message);
    } else {
      setSuccessMessage(`Timetable "${trimmedTitle}" created successfully.`);
      setTitle("");
      fetchTimetables();
    }

    setSubmitting(false);
  };

  const confirmDelete = async () => {
    if (!deletingTimetable) return;
    setSubmitting(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("timetables")
      .delete()
      .eq("id", deletingTimetable.id);

    if (error) {
      setErrorMessage("Failed to delete timetable: " + error.message);
    } else {
      setSuccessMessage(`Timetable "${deletingTimetable.title}" removed.`);
      setDeletingTimetable(null);
      fetchTimetables();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-blue-900" />
            <span>Manage Examination Timetables</span>
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Configure examination schedules for specific semesters and allocate courses to venues.
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 text-rose-900 border border-rose-200 rounded-xl text-sm flex justify-between items-center shadow-xs">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="font-bold ml-4 hover:opacity-75">&times;</button>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-sm flex justify-between items-center shadow-xs">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="font-bold ml-4 hover:opacity-75">&times;</button>
        </div>
      )}

      {/* Create Timetable Form Card */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <PlusIcon className="w-4 h-4 text-blue-900" />
          <span>Create New Examination Timetable</span>
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Timetable Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2025/2026 Second Semester Examination Timetable"
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Academic Session
            </label>
            <input
              type="text"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              placeholder="e.g. 2025/2026"
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
            >
              <option value="First Semester">First Semester</option>
              <option value="Second Semester">Second Semester</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end justify-end pt-2 sm:pt-0">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white rounded-xl text-sm font-bold transition shadow-xs flex items-center space-x-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>{submitting ? "Creating..." : "Create Timetable"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Timetables Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/90">
          <h2 className="font-bold text-slate-900">
            Active Examination Timetables ({timetables.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 text-sm">Loading timetables...</div>
        ) : timetables.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            No examination timetables created yet. Use the form above to initialize one.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {timetables.map((item) => {
              const examCount = item.exams?.[0]?.count ?? 0;
              return (
                <div
                  key={item.id}
                  className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/70 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200/60 rounded-full">
                        {item.semester}
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                        {item.session}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center space-x-2">
                      <span><strong>{examCount}</strong> scheduled exam {examCount === 1 ? "paper" : "papers"}</span>
                      <span>&bull;</span>
                      <span>Created {new Date(item.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 w-full md:w-auto justify-end shrink-0">
                    <Link
                      href={`/admin/timetables/${item.id}`}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs"
                    >
                      <span>Open Timetable Builder</span>
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => setDeletingTimetable(item)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold border border-rose-200/70 transition"
                      title="Delete Timetable"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingTimetable && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 font-semibold">"{deletingTimetable.title}"</strong>?
              This will permanently delete all associated scheduled examination papers.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingTimetable(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={submitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition shadow-xs"
              >
                {submitting ? "Deleting..." : "Yes, Delete Timetable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
