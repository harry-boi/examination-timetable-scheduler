"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function HallsPage() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [editingHall, setEditingHall] = useState(null);
  const [deletingHall, setDeletingHall] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const fetchHalls = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("halls")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      setErrorMessage("Failed to load halls: " + error.message);
    } else {
      setHalls(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHalls();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Hall name is required (e.g. Workshop 9, Hall A).");
      return;
    }

    let parsedCapacity = null;
    if (capacity !== "" && capacity !== null) {
      const parsed = parseInt(capacity, 10);
      if (isNaN(parsed) || parsed <= 0) {
        setErrorMessage("Hall capacity must be a positive number greater than 0, or leave blank if unspecified.");
        return;
      }
      parsedCapacity = parsed;
    }

    setSubmitting(true);

    if (editingHall) {
      const { error } = await supabase
        .from("halls")
        .update({
          name: trimmedName,
          capacity: parsedCapacity,
        })
        .eq("id", editingHall.id);

      if (error) {
        setErrorMessage("Failed to update hall: " + error.message);
      } else {
        setSuccessMessage(`Hall "${trimmedName}" updated successfully.`);
        setEditingHall(null);
        setName("");
        setCapacity("");
        fetchHalls();
      }
    } else {
      const { error } = await supabase.from("halls").insert([
        {
          name: trimmedName,
          capacity: parsedCapacity,
        },
      ]);

      if (error) {
        if (error.code === "23505") {
          setErrorMessage(`Hall "${trimmedName}" already exists. Please choose a different name.`);
        } else {
          setErrorMessage("Failed to add hall: " + error.message);
        }
      } else {
        setSuccessMessage(
          `Hall "${trimmedName}" ${parsedCapacity ? `(Capacity: ${parsedCapacity})` : "(No capacity limit)"} added successfully.`
        );
        setName("");
        setCapacity("");
        fetchHalls();
      }
    }

    setSubmitting(false);
  };

  const startEdit = (hall) => {
    setEditingHall(hall);
    setName(hall.name);
    setCapacity(hall.capacity !== null ? hall.capacity.toString() : "");
    setErrorMessage("");
    setSuccessMessage("");
  };

  const cancelEdit = () => {
    setEditingHall(null);
    setName("");
    setCapacity("");
    setErrorMessage("");
  };

  const confirmDelete = async () => {
    if (!deletingHall) return;
    setSubmitting(true);
    setErrorMessage("");

    const { error } = await supabase
      .from("halls")
      .delete()
      .eq("id", deletingHall.id);

    if (error) {
      setErrorMessage("Failed to delete hall: " + error.message);
    } else {
      setSuccessMessage(`Hall "${deletingHall.name}" deleted successfully.`);
      setDeletingHall(null);
      fetchHalls();
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manage Examination Halls</h1>
        <p className="text-sm text-slate-600">
          Define examination venues. Hall seating capacity is optional; when left blank, conflict checks enforce only the maximum classes per hall limit.
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
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          {editingHall ? `Edit Hall: ${editingHall.name}` : "Add New Examination Hall"}
        </h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Hall Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Workshop 9, Hall A, ETF Complex"
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Seating Capacity <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 150 (or leave empty)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end space-x-3 mt-2">
            {editingHall && (
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
              {submitting ? "Saving..." : editingHall ? "Save Changes" : "Add Hall"}
            </button>
          </div>
        </form>
      </div>

      {/* Table of Halls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">Halls List ({halls.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading halls...</div>
        ) : halls.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No examination halls added yet. Use the form above to add your first hall (e.g. Workshop 9).
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="px-6 py-3">Hall Name</th>
                  <th className="px-6 py-3">Capacity Limit</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {halls.map((hall) => (
                  <tr key={hall.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900">{hall.name}</td>
                    <td className="px-6 py-4">
                      {hall.capacity ? (
                        <span className="font-mono font-medium text-slate-900">
                          {hall.capacity} seats
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">
                          Not specified (default 3 classes max)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => startEdit(hall)}
                        className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded text-xs font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingHall(hall)}
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
      {deletingHall && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete hall{" "}
              <strong className="text-slate-900 font-semibold">"{deletingHall.name}"</strong>?
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingHall(null)}
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
                {submitting ? "Deleting..." : "Yes, Delete Hall"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
