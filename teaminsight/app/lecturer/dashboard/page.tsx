/**
 * Lecturer Dashboard Page
 * -----------------------
 * Purpose:
 * Main entry page for the lecturer after login.
 * Provides quick overview and navigation to all lecturer features.
 *
 * According to course architecture:
 * - Page-level component (App Router)
 * - No business logic here
 * - Navigation-oriented UI
 */

import Link from "next/link";
import { Users, BarChart3, Bell, MessageSquare, Settings } from "lucide-react";

export default function LecturerDashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col items-center px-6 py-12">

      {/* Page Title */}
      <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
        Lecturer Dashboard
      </h1>

      <p className="text-gray-600 mb-8">Manage teams, analytics, and communications</p>

      {/* Navigation Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">

        {/* Teams Overview */}
        <DashboardCard
          title="Teams Overview"
          description="View all teams status, progress and analytics"
          href="/lecturer/teams"
          icon={<Users className="w-8 h-8 text-blue-600" />}
          color="blue"
        />

        {/* Teams Management */}
        <DashboardCard
          title="Teams Management"
          description="Create and manage teams (members, access codes, emails)"
          href="/lecturer/teams/manage"
          icon={<Settings className="w-8 h-8 text-purple-600" />}
          color="purple"
        />

        {/* Analytics */}
        <DashboardCard
          title="Teams Analytics"
          description="Charts, tables and team statistics"
          href="/lecturer/analytics"
          icon={<BarChart3 className="w-8 h-8 text-green-600" />}
          color="green"
        />

        {/* Announcements */}
        <DashboardCard
          title="Announcements"
          description="Publish messages and tasks to teams"
          href="/lecturer/announcements"
          icon={<MessageSquare className="w-8 h-8 text-indigo-600" />}
          color="indigo"
        />

        {/* Alerts */}
        <DashboardCard
          title="Alerts & Notifications"
          description="View abnormal team states and alerts history"
          href="/lecturer/alerts"
          icon={<Bell className="w-8 h-8 text-red-600" />}
          color="red"
        />

        {/* NEW: Reflection Settings */}
        <DashboardCard
          title="Weekly Reflection Settings"
          description="Choose reflection profile and set weekly instructions"
          href="/lecturer/reflection-settings"
          icon={<Settings className="w-8 h-8 text-purple-600" />}
          color="purple"
        />

      </section>
    </main>
  );
}

/**
 * DashboardCard
 * -------------
 * Reusable UI component for dashboard navigation.
 * Pure presentational component (no state).
 */
function DashboardCard({
  title,
  description,
  href,
  icon,
  color = "blue",
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color?: "blue" | "purple" | "green" | "indigo" | "red";
}) {
  const borderColors = {
    blue: "border-l-4 border-blue-500",
    purple: "border-l-4 border-purple-500",
    green: "border-l-4 border-green-500",
    indigo: "border-l-4 border-indigo-500",
    red: "border-l-4 border-red-500",
  };

  return (
    <Link
      href={href}
      className={`block bg-white rounded-xl shadow-lg p-6 hover:shadow-xl hover:scale-105 transition-all transform ${borderColors[color]}`}
    >
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        {icon}
      </div>
      <p className="text-gray-600">{description}</p>
    </Link>
  );
}
