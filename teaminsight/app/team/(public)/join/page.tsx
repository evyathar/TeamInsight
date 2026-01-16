"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  KeyRound,
  Play,
  AlertTriangle,
  Brain,
  Sparkles,
  MessageSquare,
  PenLine,
  ClipboardCheck,
} from "lucide-react";

export default function TeamLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [teamId, setTeamId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const qTeamId = searchParams.get("teamId");
    if (qTeamId) setTeamId(qTeamId);
  }, [searchParams]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");

    const tid = teamId.trim();
    const code = accessCode.trim();

    if (!tid || !code) {
      setErrorMsg("Please enter Team ID and Access Code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/team/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: tid, accessCode: code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMsg(data?.error || "Invalid credentials or server error.");
        return;
      }

      router.push("/team");
    } catch (err) {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#E8EDF3] relative overflow-hidden">
      {/* Soft color blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-28 -left-28 h-96 w-96 rounded-full bg-emerald-300/16 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-sky-300/16 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-indigo-300/10 blur-3xl" />
      </div>

      {/* Floating product-themed icons (team + reflection + AI chat) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <Users className="absolute -top-10 -left-10 h-44 w-44 text-emerald-800 opacity-[0.06] rotate-[-12deg]" />
        <Brain className="absolute top-8 -right-10 h-44 w-44 text-indigo-900 opacity-[0.055] rotate-[10deg]" />
        <MessageSquare className="absolute -bottom-12 left-10 h-48 w-48 text-slate-900 opacity-[0.05] rotate-[8deg]" />
        <PenLine className="absolute bottom-10 -right-8 h-40 w-40 text-sky-900 opacity-[0.05] rotate-[-10deg]" />
        <ClipboardCheck className="absolute top-1/2 -left-10 h-40 w-40 text-slate-900 opacity-[0.04] rotate-[14deg]" />
        <Sparkles className="absolute top-24 left-1/2 -translate-x-1/2 h-36 w-36 text-emerald-900 opacity-[0.04] rotate-[6deg]" />
      </div>

      <div className="w-full max-w-xl rounded-2xl border border-slate-200/80 bg-[#F2F5FA] p-8 md:p-10 shadow-lg shadow-slate-900/5 relative">
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mb-1">
              Team Login
            </h1>
            <p className="text-sm text-slate-600 leading-6 max-w-sm">
              Use the Team ID and Access Code provided by the lecturer.
            </p>
          </div>

          <div className="h-11 w-11 rounded-2xl border border-slate-200 bg-white/40 backdrop-blur flex items-center justify-center">
            <Users className="h-5 w-5 text-emerald-600" />
          </div>
        </div>

        {errorMsg ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50/80 p-3 text-sm text-red-800 flex gap-2 items-start">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>{errorMsg}</div>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">
              Team ID
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#EDEFF6] pl-10 pr-3 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-300"
                placeholder="e.g., T-001"
                autoComplete="off"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">
              Access Code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-[#EDEFF6] pl-10 pr-3 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-300"
                placeholder="Enter your access code"
                type="password"
                autoComplete="off"
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-white font-semibold disabled:opacity-60 hover:bg-emerald-500 active:translate-y-[1px] flex items-center justify-center gap-2 shadow-sm shadow-emerald-900/10"
            type="submit"
          >
            <Play className="h-4 w-4" />
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

  
      </div>
    </div>
  );
}
