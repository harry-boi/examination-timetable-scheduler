"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SettingsIcon, CheckCircleIcon } from "@/components/Icons";

export default function SettingsPage() {
  const [maxClasses, setMaxClasses] = useState(3);
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const supabase = createClient();

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        setErrorMessage("Failed to load settings: " + error.message);
      } else if (data) {
        setSettingsId(data.id);
        setMaxClasses(data.max_classes_per_hall || 3);
      }
      setLoading(false);
    };

    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const parsedVal = parseInt(maxClasses, 10);
    if (isNaN(parsedVal) || parsedVal < 1) {
      setErrorMessage("Maximum classes per hall must be a positive number of at least 1.");
      return;
    }

    setSaving(true);

    if (settingsId) {
      const { error } = await supabase
        .from("settings")
        .update({ max_classes_per_hall: parsedVal })
        .eq("id", settingsId);

      if (error) {
        setErrorMessage("Failed to update settings: " + error.message);
      } else {
        setSuccessMessage("Settings updated successfully.");
      }
    } else {
      const { data, error } = await supabase
        .from("settings")
        .insert([{ max_classes_per_hall: parsedVal }])
        .select()
        .single();

      if (error) {
        setErrorMessage("Failed to save settings: " + error.message);
      } else if (data) {
        setSettingsId(data.id);
        setSuccessMessage("Settings saved successfully.");
      }
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <SettingsIcon className="w-6 h-6 text-slate-800" />
          <span>System Conflict Settings</span>
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">
          Configure institutional scheduling rules and hall-sharing thresholds.
        </p>
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

      <div className="bg-white p-7 sm:p-8 rounded-2xl border border-slate-200/90 shadow-2xs max-w-xl">
        <h2 className="text-base font-bold text-slate-900 mb-2">
          Examination Hall Sharing Threshold
        </h2>
        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
          The school policy allows multiple classes to share a hall up to a designated limit.
          When overlapping examination papers in the same hall exceed this limit, a <strong>Hall Clash</strong> will be raised.
        </p>

        {loading ? (
          <p className="text-slate-500 text-sm">Loading settings...</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Maximum Classes Allowed per Hall
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxClasses}
                  onChange={(e) => setMaxClasses(e.target.value)}
                  required
                  className="w-32 px-3.5 py-2.5 border border-slate-300 rounded-xl text-base font-bold font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-900/80 transition"
                />
                <span className="text-xs text-slate-500">classes concurrently (Default: 3)</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white rounded-xl text-sm font-bold transition shadow-xs flex items-center space-x-2"
              >
                <CheckCircleIcon className="w-4 h-4 text-emerald-300" />
                <span>{saving ? "Saving..." : "Save Configuration"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
