import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ReflectionChatSession from "@/models/ReflectionChatSession";

/* =========================
   GET /api/teams/[teamId]/reflections/chat
   Lecturer read-only view of reflection sessions
   Optional query: ?sessionId=...
   ========================= */
export async function GET(req, context) {
  try {
    await connectDB();
    const { teamId } = await context.params;

    if (!teamId) {
      return NextResponse.json({ ok: false, error: "teamId is required" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    // 1) fetch list of sessions for dropdown (latest first)
    const sessions = await ReflectionChatSession.find({ teamId })
      .select("sessionId status createdAt updatedAt aiSummary currentIndex messages")
      .sort({ updatedAt: -1 })
      .lean();

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ ok: true, sessions: [], active: null }, { status: 200 });
    }

    // 2) choose active session:
    // - if sessionId provided and exists -> use it
    // - else -> use latest updated
    let active = null;

    if (sessionId) {
      active = sessions.find((s) => s.sessionId === sessionId) || null;
    }
    if (!active) {
      active = sessions[0];
    }

    // keep payload small: build a compact sessions list
    const sessionsList = sessions.map((s) => ({
      sessionId: s.sessionId,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      aiSummary: s.aiSummary || "",
      currentIndex: s.currentIndex ?? 0,
      messagesCount: Array.isArray(s.messages) ? s.messages.length : 0,
    }));

    return NextResponse.json(
      {
        ok: true,
        sessions: sessionsList,
        active: {
          sessionId: active.sessionId,
          status: active.status,
          createdAt: active.createdAt,
          updatedAt: active.updatedAt,
          aiSummary: active.aiSummary || "",
          currentIndex: active.currentIndex ?? 0,
          messages: Array.isArray(active.messages) ? active.messages : [],
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
