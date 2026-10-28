"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
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
      // Update
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
      // Insert
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
      setSuccessMessage(`Department "${deletingDept.name}" deleted successfully.`);
      setDeletingDept(null);
      fetchDepartments();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Departments</h1>
          <p className="text-sm text-slate-600">
            Define academic departments and their official short codes.
          </p>
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

      {/* Add / Edit Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          {editingDept ? `Edit Department: ${editingDept.name}` : "Add New Department"}
        </h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Department Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Software Development"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Department Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SWD"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900 uppercase"
            />
          </div>
          <div className="sm:col-span-3 flex justify-end space-x-3 mt-2">
            {editingDept && (
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
              {submitting ? "Saving..." : editingDept ? "Save Changes" : "Add Department"}
            </button>
          </div>
        </form>
      </div>

      {/* Table of Departments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">Departments List ({departments.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading departments...</div>
        ) : departments.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No departments added yet. Use the form above to add your first department.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Department Name</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-mono font-bold text-blue-900">{dept.code}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{dept.name}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => startEdit(dept)}
                        className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingDept(dept)}
                        className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded text-xs font-semibold transition"
                      >
                        Delete
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete the department{" "}
              <strong className="text-slate-900 font-semibold">"{deletingDept.name}" ({deletingDept.code})</strong>?
              This will also remove all associated classes and courses.
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
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
                {submitting ? "Deleting..." : "Yes, Delete Department"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
