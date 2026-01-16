"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/team/chat", label: "Chat" },
  { href: "/team/reflection", label: "Reflection" },
  { href: "/team/messages", label: "Messages" },
  { href: "/team/info", label: "Team Info" },
  { href: "/team/reflection", label: "Reflection" },
  { href: "/team/announcements", label: "Announcements" }

];

export default function TeamTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 flex-wrap">
      {tabs.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={[
              "rounded-lg px-6 py-3 text-sm font-semibold transition-all",
              active 
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg" 
                : "bg-white/70 text-gray-700 hover:bg-white hover:shadow-md",
            ].join(" ")}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
