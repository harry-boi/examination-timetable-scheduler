"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
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

    // Fetch classes with department info
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

    // Fetch courses with joined class and department
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
      setErrorMessage("Please select a class for this course.");
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
      setSuccessMessage("Course deleted successfully.");
      setDeletingCourse(null);
      fetchData();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Courses</h1>
        <p className="text-sm text-slate-600">
          Define courses and allocate them to their offering class.
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

      {/* Add / Edit Form */}
      {classesList.length === 0 && !loading ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm">
          <p className="font-semibold mb-1">No Classes Available</p>
          <p>
            You must create a class (e.g. SWD HND 2) before adding courses.{" "}
            <Link href="/admin/classes" className="underline font-bold text-blue-900">
              Go to Classes &rarr;
            </Link>
          </p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            {editingCourse ? `Edit Course: ${editingCourse.code}` : "Add New Course"}
          </h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Course Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. SWD 422"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Course Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Software Testing and Quality Assurance"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Class
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                {classesList.map((cls) => {
                  const deptCode = cls.departments?.code || "DEPT";
                  return (
                    <option key={cls.id} value={cls.id}>
                      {deptCode} {cls.level} ({cls.student_count} students) &bull; {cls.departments?.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="sm:col-span-3 flex justify-end space-x-3 mt-2">
              {editingCourse && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold transition shadow-sm"
              >
                {submitting ? "Saving..." : editingCourse ? "Save Changes" : "Add Course"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table of Courses */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">Courses List ({courses.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No courses added yet. Use the form above to add courses.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="px-6 py-3">Course Code</th>
                  <th className="px-6 py-3">Course Title</th>
                  <th className="px-6 py-3">Class</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((crs) => {
                  const deptCode = crs.classes?.departments?.code || "DEPT";
                  const classNameFormatted = `${deptCode} ${crs.classes?.level || ""}`;
                  return (
                    <tr key={crs.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-mono font-bold text-blue-900">{crs.code}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{crs.title}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-xs">
                          {classNameFormatted}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => startEdit(crs)}
                          className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-semibold transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingCourse(crs)}
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

      {/* Delete Confirmation Modal */}
      {deletingCourse && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete course{" "}
              <strong className="text-slate-900 font-semibold">
                "{deletingCourse.code} - {deletingCourse.title}"
              </strong>?
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingCourse(null)}
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
                {submitting ? "Deleting..." : "Yes, Delete Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
