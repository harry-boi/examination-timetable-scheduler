"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, BuildingIcon } from "@/components/Icons";

export default function HallsPage() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
      setErrorMessage("Hall name is required (e.g. Workshop 9, ETF Hall).");
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      setSuccessMessage(`Hall "${deletingHall.name}" deleted.`);
      setDeletingHall(null);
      fetchHalls();
    }
    setSubmitting(false);
  };

  const filteredHalls = halls.filter((h) =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <BuildingIcon className="w-6 h-6 text-purple-700" />
            <span>Manage Examination Halls</span>
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Configure examination venues. Hall seating capacity is optional; when unstated, only maximum class limits apply.
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
          <span>{editingHall ? `Edit Hall: ${editingHall.name}` : "Add New Examination Hall"}</span>
        </h2>
        <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Hall / Venue Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Workshop 9, ETF Lecture Hall, Hall 1"
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Seating Capacity <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 150 (or leave empty)"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
            />
          </div>

          <div className="sm:col-span-3 flex justify-end space-x-3 pt-2">
            {editingHall && (
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
              {submitting ? "Saving..." : editingHall ? "Save Changes" : "Add Hall"}
            </button>
          </div>
        </form>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="font-bold text-slate-900">
            Halls Directory ({halls.length})
          </h2>
          <div className="relative w-full sm:w-64">
            <SearchIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter halls..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-500 text-sm">Loading halls...</div>
        ) : filteredHalls.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            {searchTerm ? `No halls matching "${searchTerm}".` : "No examination halls added yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50/70 text-slate-600 font-bold text-left text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Hall Name</th>
                  <th className="px-6 py-3.5">Capacity Limit</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHalls.map((hall) => (
                  <tr key={hall.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-6 py-4 font-bold text-slate-900 text-base">{hall.name}</td>
                    <td className="px-6 py-4">
                      {hall.capacity ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-purple-50 text-purple-900 border border-purple-200/70 rounded-md font-mono font-bold text-xs">
                          <span>{hall.capacity} seats</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">
                          Unrestricted (default max classes rule applies)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => startEdit(hall)}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold transition"
                      >
                        <EditIcon className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeletingHall(hall)}
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
      {deletingHall && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">Confirm Deletion</h3>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete hall{" "}
              <strong className="text-slate-900 font-semibold">"{deletingHall.name}"</strong>?
            </p>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeletingHall(null)}
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
                {submitting ? "Deleting..." : "Yes, Delete Hall"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
