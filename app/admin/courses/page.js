"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, BookOpenIcon } from "@/components/Icons";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [classId, setClassId] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);

    const { data: cls, error: clsErr } = await supabase
      .from("classes")
      .select("id, level, student_count, departments(name, code)")
      .order("level", { ascending: true });

    if (clsErr) {
      setErrorMessage("Failed to load classes: " + clsErr.message);
    } else {
      setClassesList(cls || []);
      if (cls && cls.length > 0 && !classId) {
        setClassId(cls[0].id);
      }
    }

    const { data: crs, error: crsErr } = await supabase
      .from("courses")
      .select("*, classes(id, level, student_count, departments(name, code))")
      .order("code", { ascending: true });

    if (crsErr) {
      setErrorMessage("Failed to load courses: " + crsErr.message);
    } else {
      setCourses(crs || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedCode = code.trim().toUpperCase();
    const trimmedTitle = title.trim();

    if (!trimmedCode) {
      setErrorMessage("Course code is required (e.g. SWD 422).");
      return;
    }
    if (!trimmedTitle) {
      setErrorMessage("Course title is required.");
      return;
    }
    if (!classId) {
      setErrorMessage("Please select an offering class for this course.");
      return;
    }

    setSubmitting(true);

    if (editingCourse) {
      const { error } = await supabase
        .from("courses")
        .update({
          code: trimmedCode,
          title: trimmedTitle,
          class_id: classId,
        })
        .eq("id", editingCourse.id);

      if (error) {
        setErrorMessage("Failed to update course: " + error.message);
      } else {
        setSuccessMessage(`Course "${trimmedCode}" updated successfully.`);
        setEditingCourse(null);
        setCode("");
        setTitle("");
        fetchData();
      }
    } else {
      const { error } = await supabase.from("courses").insert([
        {
          code: trimmedCode,
          title: trimmedTitle,
          class_id: classId,
        },
      ]);

      if (error) {
        setErrorMessage("Failed to add course: " + error.message);
      } else {
        setSuccessMessage(`Course "${trimmedCode} - ${trimmedTitle}" added successfully.`);
        setCode("");
        setTitle("");
        fetchData();
      }
    }

    setSubmitting(false);
  };

  const startEdit = (crs) => {
    setEditingCourse(crs);
    setCode(crs.code);
    setTitle(crs.title);
    setClassId(crs.class_id);
    setErrorMessage("");
    setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingCourse(null);
    setCode("");
    setTitle("");
    setErrorMessage("");
  };

  const confirmDelete = async () => {
    if (!deletingCourse) return;
    setSubmitting(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", deletingCourse.id);

    if (error) {
      setErrorMessage("Failed to delete course: " + error.message);
    } else {
      setSuccessMessage("Course removed.");
      setDeletingCourse(null);
      fetchData();
    }
    setSubmitting(false);
  };

  const filteredCourses = courses.filter((c) => {
    const term = searchTerm.toLowerCase();
    const codeMatch = c.code.toLowerCase().includes(term);
    const titleMatch = c.title.toLowerCase().includes(term);
    const deptMatch = c.classes?.departments?.code?.toLowerCase().includes(term) || false;
    return codeMatch || titleMatch || deptMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <BookOpenIcon className="w-6 h-6 text-emerald-700" />
            <span>Manage Semester Courses</span>
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Define courses and link each course to its designated offering class.
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

      {/* Add / Edit Form Card */}
      {classesList.length === 0 && !loading ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm">
          <p className="font-bold mb-1">Classes Required</p>
          <p>
            You must define at least one class (e.g. SWD HND 2) before adding courses.{" "}
            <Link href="/admin/classes" className="underline font-bold text-blue-900">
              Create Classes &rarr;
            </Link>
          </p>
        </div>
      ) : (
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <PlusIcon className="w-4 h-4 text-blue-900" />
            <span>{editingCourse ? `Edit Course: ${editingCourse.code}` : "Add New Course"}</span>
          </h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Course Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SWD 422"
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm uppercase font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Course Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Testing and Quality Assurance"
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Assigned Offering Class
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
              >
                {classesList.map((cls) => {
                  const deptCode = cls.departments?.code || "DEPT";
                  return (
                    <option key={cls.id} value={cls.id}>
                      {deptCode} {cls.level} &bull; {cls.student_count} students ({cls.departments?.name})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="sm:col-span-3 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
              {editingCourse && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full sm:w-auto px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition text-center"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white rounded-xl text-sm font-bold transition shadow-xs text-center"
              >
                {submitting ? "Saving..." : editingCourse ? "Save Changes" : "Add Course"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="font-bold text-slate-900">
            Course Catalog ({courses.length})
          </h2>
          <div className="relative w-full sm:w-64">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search course code or title..."
              className="w-full pl-9 pr-3 py-2 sm:py-1.5 border border-slate-300 rounded-xl sm:rounded-lg text-sm sm:text-xs focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 sm:p-10 text-center text-slate-500 text-sm">Loading courses...</div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-8 sm:p-10 text-center text-slate-500 text-sm">
            {searchTerm ? `No courses matching "${searchTerm}".` : "No courses added yet."}
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredCourses.map((crs) => {
                const deptCode = crs.classes?.departments?.code || "DEPT";
                const classNameFormatted = `${deptCode} ${crs.classes?.level || ""}`;
                return (
                  <div key={crs.id} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/70 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-xs px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200/70 rounded-md">
                          {crs.code}
                        </span>
                        <h3 className="font-bold text-slate-900 text-base mt-1.5">{crs.title}</h3>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50/80 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Class:</span>
                      <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-white border border-slate-200 text-slate-800 rounded-lg font-bold">
                        <span>{classNameFormatted}</span>
                        <span className="text-slate-400 font-normal">({crs.classes?.student_count || 0} students)</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => startEdit(crs)}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        <EditIcon className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingCourse(crs)}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50/70 text-slate-600 font-bold text-left text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Code</th>
                    <th className="px-6 py-3.5">Course Title</th>
                    <th className="px-6 py-3.5">Class Association</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCourses.map((crs) => {
                    const deptCode = crs.classes?.departments?.code || "DEPT";
                    const classNameFormatted = `${deptCode} ${crs.classes?.level || ""}`;
                    return (
                      <tr key={crs.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-xs px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200/70 rounded-md">
                            {crs.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">{crs.title}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-lg font-bold text-xs">
                            <span>{classNameFormatted}</span>
                            <span className="text-slate-400 font-normal">({crs.classes?.student_count || 0} students)</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => startEdit(crs)}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingCourse(crs)}
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
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete course{" "}
              <strong className="text-slate-900 font-semibold">
                "{deletingCourse.code} - {deletingCourse.title}"
              </strong>?
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setDeletingCourse(null)}
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
                {submitting ? "Deleting..." : "Yes, Delete Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
