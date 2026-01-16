"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function TeamAnnouncementsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      setItems(data.announcements || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading)
    return (
      <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-gray-600">
        Loading…
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">Announcements</h1>
          <p className="text-gray-600 mt-1">View team announcements from your lecturer</p>
        </div>

        <Link
          href="/team"
          className="text-purple-600 hover:text-purple-700 hover:underline text-sm font-medium"
        >
          ← Back to Team Dashboard
        </Link>
      </div>

      <div className="text-xs text-gray-500">
        {items.length} item{items.length === 1 ? "" : "s"}
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border bg-gradient-to-br from-purple-50 to-indigo-50 p-6 text-sm text-gray-700 shadow-sm">
          No announcements
        </div>
      ) : (
        items.map((a) => (
          <div
            key={a._id}
            className="rounded-xl border border-purple-100 bg-white p-5 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="text-lg font-semibold text-gray-900">
                {a.title}
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {new Date(a.createdAt).toLocaleString()}
              </div>
            </div>

            <div className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
              {a.body}
            </div>
          </div>
        ))
      )}
    </div>
  );
}