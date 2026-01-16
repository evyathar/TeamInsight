import Link from "next/link";

/*
  Landing Page
  ============
  Entry point for the system.
  Allows navigation to:
  - Lecturer Login
  - Team Login / Join
*/

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 flex flex-col items-center justify-center px-6">
      
      {/* Title */}
      <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
        TeamInsight
      </h1>

      <p className="text-lg text-gray-700 mb-12 text-center max-w-md">
        Project monitoring and analytics platform for lecturers and teams
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
        
        {/* Lecturer */}
        <EntryCard
          title="Lecturer Portal"
          description="Login to manage teams, analytics, alerts and announcements"
          href="/lecturer/login"
        />

        {/* Team */}
        <EntryCard
          title="Team Portal"
          description="Join your team, submit reflections and view announcements"
          href="/team/join"
        />

      </div>
    </main>
  );
}

/* ---------- Reusable Card ---------- */

function EntryCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 hover:shadow-xl hover:scale-105 transition-all transform"
    >
      <h2 className="text-2xl font-semibold mb-3 text-purple-600">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </Link>
  );
}
