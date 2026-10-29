"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, UsersIcon } from "@/components/Icons";

const POLY_LEVELS = ["ND 1", "ND 2", "HND 1", "HND 2"];

export default function ClassesPage() {
  const [classesList, setClassesList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
      setErrorMessage("Please select a class level (e.g. ND 1, HND 2).");
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
            "This class (selected department + level) already exists. Please select a different level or edit the existing class."
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const filteredClasses = classesList.filter((c) => {
    const term = searchTerm.toLowerCase();
    const deptCode = c.departments?.code?.toLowerCase() || "";
    const deptName = c.departments?.name?.toLowerCase() || "";
    const lvl = c.level?.toLowerCase() || "";
    return deptCode.includes(term) || deptName.includes(term) || lvl.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <UsersIcon className="w-6 h-6 text-amber-600" />
            <span>Manage Academic Classes</span>
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            A Class represents a Department + Level combination (e.g. SWD HND 2) with enrolled student headcount.
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
      {departments.length === 0 && !loading ? (
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm">
          <p className="font-bold mb-1">Departments Required</p>
          <p>
            You must configure at least one academic department before creating classes.{" "}
            <Link href="/admin/departments" className="underline font-bold text-blue-900">
              Create Departments &rarr;
            </Link>
          </p>
        </div>
      ) : (
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <PlusIcon className="w-4 h-4 text-blue-900" />
            <span>{editingClass ? `Edit Class` : "Add New Class"}</span>
          </h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
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
                Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
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
                Enrolled Student Count
              </label>
              <input
                type="number"
                min="0"
                value={studentCount}
                onChange={(e) => setStudentCount(e.target.value)}
                placeholder="e.g. 40"
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
              />
            </div>

            <div className="sm:col-span-3 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 pt-2">
              {editingClass && (
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
                {submitting ? "Saving..." : editingClass ? "Save Changes" : "Add Class"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="font-bold text-slate-900">
            Classes List ({classesList.length})
          </h2>
          <div className="relative w-full sm:w-64">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search classes or levels..."
              className="w-full pl-9 pr-3 py-2 sm:py-1.5 border border-slate-300 rounded-xl sm:rounded-lg text-sm sm:text-xs focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 sm:p-10 text-center text-slate-500 text-sm">Loading classes...</div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-8 sm:p-10 text-center text-slate-500 text-sm">
            {searchTerm ? `No classes matching "${searchTerm}".` : "No classes created yet. Add a class above."}
          </div>
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filteredClasses.map((cls) => {
                const deptCode = cls.departments?.code || "DEPT";
                const classNameFormatted = `${deptCode} ${cls.level}`;
                return (
                  <div key={cls.id} className="p-4 sm:p-5 space-y-3 hover:bg-slate-50/70 transition">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-blue-900 text-base">
                          {classNameFormatted}
                        </span>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {cls.departments?.name}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-bold text-xs">
                        {cls.level}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-50/80 rounded-xl flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Enrolled Headcount:</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {cls.student_count} students
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => startEdit(cls)}
                        className="flex-1 inline-flex items-center justify-center space-x-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                      >
                        <EditIcon className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingClass(cls)}
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
                    <th className="px-6 py-3.5">Class Name</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Level</th>
                    <th className="px-6 py-3.5">Students</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClasses.map((cls) => {
                    const deptCode = cls.departments?.code || "DEPT";
                    const classNameFormatted = `${deptCode} ${cls.level}`;
                    return (
                      <tr key={cls.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-6 py-4 font-extrabold text-blue-900 text-base">{classNameFormatted}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">{cls.departments?.name}</td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-bold text-xs">
                            {cls.level}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {cls.student_count}
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => startEdit(cls)}
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => setDeletingClass(cls)}
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
      {deletingClass && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete class{" "}
              <strong className="text-slate-900 font-semibold">
                "{deletingClass.departments?.code} {deletingClass.level}"
              </strong>?
              Associated course records will also be removed.
            </p>
            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setDeletingClass(null)}
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
                {submitting ? "Deleting..." : "Yes, Delete Class"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
