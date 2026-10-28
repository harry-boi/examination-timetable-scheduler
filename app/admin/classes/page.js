"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

const POLY_LEVELS = ["ND 1", "ND 2", "HND 1", "HND 2"];

export default function ClassesPage() {
  const [classesList, setClassesList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [departmentId, setDepartmentId] = useState("");
  const [level, setLevel] = useState("ND 1");
  const [studentCount, setStudentCount] = useState("");
  const [editingClass, setEditingClass] = useState(null);
  const [deletingClass, setDeletingClass] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    // Fetch departments
    const { data: depts, error: deptsErr } = await supabase
      .from("departments")
      .select("*")
      .order("name", { ascending: true });

    if (deptsErr) {
      setErrorMessage("Failed to load departments: " + deptsErr.message);
    } else {
      setDepartments(depts || []);
      if (depts && depts.length > 0 && !departmentId) {
        setDepartmentId(depts[0].id);
      }
    }

    // Fetch classes joined with departments
    const { data: cls, error: clsErr } = await supabase
      .from("classes")
      .select("*, departments(id, name, code)")
      .order("created_at", { ascending: false });

    if (clsErr) {
      setErrorMessage("Failed to load classes: " + clsErr.message);
    } else {
      setClassesList(cls || []);
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

    if (!departmentId) {
      setErrorMessage("Please select a department.");
      return;
    }
    if (!level) {
      setErrorMessage("Please select or specify a class level (e.g. ND 1, HND 2).");
      return;
    }

    const countNum = parseInt(studentCount, 10);
    if (isNaN(countNum) || countNum < 0) {
      setErrorMessage("Student count must be a non-negative number (0 or higher).");
      return;
    }

    setSubmitting(true);

    if (editingClass) {
      const { error } = await supabase
        .from("classes")
        .update({
          department_id: departmentId,
          level,
          student_count: countNum,
        })
        .eq("id", editingClass.id);

      if (error) {
        setErrorMessage("Failed to update class: " + error.message);
      } else {
        setSuccessMessage("Class updated successfully.");
        setEditingClass(null);
        setStudentCount("");
        fetchData();
      }
    } else {
      const { error } = await supabase.from("classes").insert([
        {
          department_id: departmentId,
          level,
          student_count: countNum,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          setErrorMessage(
            "This class (selected department + level) already exists. Please choose a different level or edit the existing class."
          );
        } else {
          setErrorMessage("Failed to add class: " + error.message);
        }
      } else {
        const selectedDept = departments.find((d) => d.id === departmentId);
        const deptCode = selectedDept?.code || "Department";
        setSuccessMessage(`Class "${deptCode} ${level}" (${countNum} students) added successfully.`);
        setStudentCount("");
        fetchData();
      }
    }

    setSubmitting(false);
  };

  const startEdit = (cls) => {
    setEditingClass(cls);
    setDepartmentId(cls.department_id);
    setLevel(cls.level);
    setStudentCount(cls.student_count.toString());
    setErrorMessage("");
    setSuccessMessage("");
  };

  const cancelEdit = () => {
    setEditingClass(null);
    setStudentCount("");
    setErrorMessage("");
  };

  const confirmDelete = async () => {
    if (!deletingClass) return;
    setSubmitting(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("classes")
      .delete()
      .eq("id", deletingClass.id);

    if (error) {
      setErrorMessage("Failed to delete class: " + error.message);
    } else {
      setSuccessMessage("Class deleted successfully.");
      setDeletingClass(null);
      fetchData();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Classes</h1>
        <p className="text-sm text-slate-600">
          A Class is defined as a Department plus an Academic Level (e.g., SWD HND 2), with its enrolled student count.
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
      {departments.length === 0 && !loading ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm">
          <p className="font-semibold mb-1">No Departments Found</p>
          <p>
            You must add at least one department before creating classes.{" "}
            <Link href="/admin/departments" className="underline font-bold text-blue-900">
              Go to Departments &rarr;
            </Link>
          </p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            {editingClass ? `Edit Class` : "Add New Class"}
          </h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                {POLY_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Student Count
              </label>
              <input
                type="number"
                min="0"
                value={studentCount}
                onChange={(e) => setStudentCount(e.target.value)}
                placeholder="e.g. 40"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end space-x-3 mt-2">
              {editingClass && (
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
                {submitting ? "Saving..." : editingClass ? "Save Changes" : "Add Class"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table of Classes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">Classes List ({classesList.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading classes...</div>
        ) : classesList.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No classes created yet. Add a class above (e.g., SWD HND 2).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="px-6 py-3">Class Name</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Level</th>
                  <th className="px-6 py-3">Enrolled Students</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classesList.map((cls) => {
                  const deptCode = cls.departments?.code || "DEPT";
                  const classNameFormatted = `${deptCode} ${cls.level}`;
                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 font-bold text-blue-900">{classNameFormatted}</td>
                      <td className="px-6 py-4 text-slate-800">{cls.departments?.name}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                          {cls.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-900">
                        {cls.student_count}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => startEdit(cls)}
                          className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-semibold transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingClass(cls)}
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
      {deletingClass && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete the class{" "}
              <strong className="text-slate-900 font-semibold">
                "{deletingClass.departments?.code} {deletingClass.level}"
              </strong>?
              This will also remove all courses attached to this class.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingClass(null)}
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
                {submitting ? "Deleting..." : "Yes, Delete Class"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
