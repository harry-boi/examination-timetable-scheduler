"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, LayersIcon } from "@/components/Icons";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [editingDept, setEditingDept] = useState(null);
  const [deletingDept, setDeletingDept] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const fetchDepartments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setErrorMessage("Failed to load departments. " + error.message);
    } else {
      setDepartments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedName) {
      setErrorMessage("Department name is required.");
      return;
    }
    if (!trimmedCode) {
      setErrorMessage("Department code is required (e.g., SWD, COM).");
      return;
    }

    setSubmitting(true);

    if (editingDept) {
      const { error } = await supabase
        .from("departments")
        .update({ name: trimmedName, code: trimmedCode })
        .eq("id", editingDept.id);

      if (error) {
        setErrorMessage("Failed to update department: " + error.message);
      } else {
        setSuccessMessage(`Department "${trimmedName}" updated successfully.`);
        setEditingDept(null);
        setName("");
        setCode("");
        fetchDepartments();
      }
    } else {
      const { error } = await supabase
        .from("departments")
        .insert([{ name: trimmedName, code: trimmedCode }]);

      if (error) {
        if (error.code === "23505") {
          setErrorMessage(`Department code "${trimmedCode}" already exists. Please choose a unique code.`);
        } else {
          setErrorMessage("Failed to create department: " + error.message);
        }
      } else {
        setSuccessMessage(`Department "${trimmedName}" (${trimmedCode}) added successfully.`);
        setName("");
        setCode("");
        fetchDepartments();
      }
    }

    setSubmitting(false);
  };

  const startEdit = (dept) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setErrorMessage("");
    setSuccessMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingDept(null);
    setName("");
    setCode("");
    setErrorMessage("");
  };

  const confirmDelete = async () => {
    if (!deletingDept) return;
    setSubmitting(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("departments")
      .delete()
      .eq("id", deletingDept.id);

    if (error) {
      setErrorMessage("Could not delete department: " + error.message);
    } else {
      setSuccessMessage(`Department "${deletingDept.name}" deleted.`);
      setDeletingDept(null);
      fetchDepartments();
    }
    setSubmitting(false);
  };

  const filteredDepts = departments.filter((d) => {
    const term = searchTerm.toLowerCase();
    return d.name.toLowerCase().includes(term) || d.code.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <LayersIcon className="w-6 h-6 text-blue-900" />
            <span>Manage Academic Departments</span>
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Define departments and official abbreviations used in timetable scheduling.
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
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-2xs">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <PlusIcon className="w-4 h-4 text-blue-900" />
          <span>{editingDept ? `Edit Department: ${editingDept.name}` : "Add New Department"}</span>
        </h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Department Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Software Development, Computer Science"
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Department Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SWD"
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 uppercase font-mono font-semibold transition"
            />
          </div>
          <div className="sm:col-span-3 flex justify-end space-x-3 pt-2">
            {editingDept && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white rounded-xl text-sm font-bold transition shadow-xs"
            >
              {submitting ? "Saving..." : editingDept ? "Save Changes" : "Add Department"}
            </button>
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="font-bold text-slate-900">
            Departments Directory ({departments.length})
          </h2>
          <div className="relative w-full sm:w-64">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter departments..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 text-sm">Loading departments...</div>
        ) : filteredDepts.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            {searchTerm ? `No departments matching "${searchTerm}".` : "No departments added yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/70 text-slate-600 font-bold text-left text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">Department Name</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDepts.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200/70 rounded-md">
                        {dept.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{dept.name}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => startEdit(dept)}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
                      >
                        <EditIcon className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingDept(dept)}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 font-semibold">"{deletingDept.name}" ({deletingDept.code})</strong>?
              This will also remove associated classes and course records.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
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
                {submitting ? "Deleting..." : "Yes, Delete Department"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
