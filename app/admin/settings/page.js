"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
      setErrorMessage("Maximum classes per hall must be a positive integer (at least 1).");
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
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-sm text-slate-600">
          Configure institutional scheduling rules and hall allocation thresholds.
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

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-xl">
        <h2 className="text-base font-semibold text-slate-900 mb-4">
          Hall Sharing Thresholds
        </h2>

        {loading ? (
          <p className="text-slate-500 text-sm">Loading settings...</p>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Maximum Number of Classes Per Hall
              </label>
              <input
                type="number"
                min="1"
                value={maxClasses}
                onChange={(e) => setMaxClasses(e.target.value)}
                required
                className="w-full sm:w-48 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Default is 3. If exam papers in the same hall overlap in time and exceed this number of distinct classes, a <strong>Hall Clash</strong> conflict will be flagged.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold transition shadow-sm"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
