"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { Settings, ArrowLeft } from "lucide-react";

type Profile = {
  key: string;
  title: string;
  description: string;
  greenMin: number;
  redMax: number;
};

type ProfilesRes =
  | { ok: true; profiles: Profile[] }
  | { error: string; details?: string };

type SettingsRes =
  | { ok: true; selectedProfileKey: string; weeklyInstructions: string }
  | { error: string; details?: string };

export default function LecturerReflectionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileKey, setSelectedProfileKey] = useState("default");
  const [weeklyInstructions, setWeeklyInstructions] = useState("");

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.key === selectedProfileKey),
    [profiles, selectedProfileKey]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const [pRes, sRes] = await Promise.all([
          fetch("/api/lecturer/reflection/profiles", { cache: "no-store" }),
          fetch("/api/lecturer/reflection/settings", { cache: "no-store" }),
        ]);

        const pData = (await pRes.json()) as ProfilesRes;
        const sData = (await sRes.json()) as SettingsRes;

        if (cancelled) return;

        if ("ok" in pData && pData.ok) setProfiles(pData.profiles || []);
        else console.error("Profiles load failed:", pData);

        if ("ok" in sData && sData.ok) {
          setSelectedProfileKey(sData.selectedProfileKey || "default");
          setWeeklyInstructions(sData.weeklyInstructions || "");
        } else {
          console.error("Settings load failed:", sData);
        }
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSave() {
    try {
      setSaving(true);
      const res = await fetch("/api/lecturer/reflection/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedProfileKey, weeklyInstructions }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Save failed:", data);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col items-center px-6 py-12">
      {/* Header */}
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/lecturer/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm shadow hover:shadow-md transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>

          <div className="inline-flex items-center gap-2 text-sm text-gray-600">
            <Settings className="w-4 h-4 text-purple-600" />
            Lecturer
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
          Weekly Reflection Settings
        </h1>

        <p className="text-gray-600 mb-8">
          Choose a chat profile and set weekly instructions used by the reflection bot.
        </p>

        {/* Main Card */}
        <section className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          {/* Profile */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Profile</label>

            {loading ? (
              <div className="text-sm text-gray-500">Loading...</div>
            ) : (
              <select
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                value={selectedProfileKey}
                onChange={(e) => setSelectedProfileKey(e.target.value)}
              >
                {profiles.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.title} ({p.key})
                  </option>
                ))}
              </select>
            )}

            {selectedProfile ? (
              <div className="mt-3 rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 p-4">
                <div className="text-sm font-medium text-gray-900">
                  {selectedProfile.title}
                </div>
                <div className="mt-1 text-sm text-gray-700">
                  {selectedProfile.description}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Thresholds: greenMin={selectedProfile.greenMin}, redMax={selectedProfile.redMax}
                </div>
              </div>
            ) : null}
          </div>

          {/* Weekly Instructions */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Weekly Instructions (optional)
            </label>

            <textarea
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm min-h-[160px] focus:outline-none focus:ring-2 focus:ring-purple-200"
              value={weeklyInstructions}
              onChange={(e) => setWeeklyInstructions(e.target.value)}
              placeholder="Example: This week focus on blockers, mitigation owners, and PR links."
            />

            <div className="text-xs text-gray-500 mt-2">
              Leave empty to disable weekly instructions.
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onSave}
              disabled={loading || saving}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-purple-700 hover:to-indigo-700 transition disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
