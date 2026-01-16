"use client";

/*
  Lecturer – Announcements Page (FINAL)
  ====================================
  ✔ Consistent with Dashboard / Teams pages
  ✔ Back button on the right
  ✔ POST works
  ✔ Auto-refresh after publish (NO manual refresh)
  ✔ Defensive rendering (no runtime errors)
  ✔ Tailwind CSS
*/

import { useEffect, useState } from "react";
import Link from "next/link";

type Announcement = {
  _id: string;
  title?: string;
  body?: string;
  targetTeams: string[] | "all";
  createdAt: string;
};

export default function AnnouncementsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  async function loadAnnouncements() {
    setLoading(true);
    const res = await fetch("/api/announcements");
    const data = await res.json();
    if (data.ok) setAnnouncements(data.announcements);
    setLoading(false);
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function publishAnnouncement() {
    if (!title.trim() || !body.trim()) return;

    setPublishing(true);

    const res = await fetch("/api/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        body,
        targetTeams: "all",
      }),
    });

    const data = await res.json();

    if (data.ok) {
      setTitle("");
      setBody("");
      await loadAnnouncements(); // 🔁 auto refresh
    }

    setPublishing(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 px-8 py-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Announcements</h1>
          <p className="text-gray-600 mt-1">Publish messages and tasks to teams</p>
        </div>

        <Link
          href="/lecturer/dashboard"
          className="text-purple-600 hover:text-purple-700 hover:underline text-sm font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Publish Form */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-10 max-w-3xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Publish New Announcement
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <textarea
            placeholder="Message / Task description"
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />

          <button
            onClick={publishAnnouncement}
            disabled={publishing}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 font-semibold"
          >
            {publishing ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {/* Announcements List */}
      <div className="max-w-3xl">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Published Announcements
        </h2>

        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="text-gray-500">No announcements yet</div>
        ) : (
          <div className="space-y-4">
            {announcements.map(a => (
              <div
                key={a._id}
                className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-purple-500"
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-lg text-gray-800">
                    {a.title ?? "Untitled"}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-gray-700">
                  {a.body ?? ""}
                </p>

                <div className="mt-3 text-sm text-gray-500">
                  Target:{" "}
                  {a.targetTeams === "all"
                    ? "All Teams"
                    : a.targetTeams.join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
