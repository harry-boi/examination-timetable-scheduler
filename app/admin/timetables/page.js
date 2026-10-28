"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function TimetablesListPage() {
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);

  // New timetable form states
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
      setErrorMessage("Timetable title is required (e.g., 'ND 1 & HND 1 Examination Timetable').");
      return;
    }
    if (!trimmedSession) {
      setErrorMessage("Academic session is required (e.g., '2025/2026').");
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
      setSuccessMessage(`Timetable "${deletingTimetable.title}" deleted.`);
      setDeletingTimetable(null);
      fetchTimetables();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Examination Timetables</h1>
        <p className="text-sm text-slate-600">
          Create examination periods for academic semesters and schedule course papers into halls.
        </p>
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

      {/* Create Timetable Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Create New Examination Timetable
        </h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Timetable Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2025/2026 Second Semester Examination Timetable"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Academic Session
            </label>
            <input
              type="text"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              placeholder="e.g. 2025/2026"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="First Semester">First Semester</option>
              <option value="Second Semester">Second Semester</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold transition shadow-sm"
            >
              {submitting ? "Creating..." : "Create Timetable"}
            </button>
          </div>
        </form>
      </div>

      {/* Timetables Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Active Timetables ({timetables.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading timetables...</div>
        ) : timetables.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No examination timetables created yet. Create one using the form above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {timetables.map((item) => {
              const examCount = item.exams?.[0]?.count ?? 0;
              return (
                <div
                  key={item.id}
                  className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/60 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                      <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-800 rounded-md">
                        {item.semester}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 rounded-md">
                        {item.session}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {examCount} scheduled exam {examCount === 1 ? "paper" : "papers"} &bull; Created {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
                    <Link
                      href={`/admin/timetables/${item.id}`}
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                    >
                      Open Timetable Builder &rarr;
                    </Link>
                    <button
                      onClick={() => setDeletingTimetable(item)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200 transition"
                    >
                      Delete
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 font-semibold">"{deletingTimetable.title}"</strong>?
              This will remove the entire timetable and all scheduled examination entries inside it.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingTimetable(null)}
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
                {submitting ? "Deleting..." : "Yes, Delete Timetable"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
