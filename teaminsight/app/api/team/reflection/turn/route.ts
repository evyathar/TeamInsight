import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { connectDB } from "@/lib/db";
import { verifyTeamSession } from "@/lib/teamSession";

import ReflectionChatSession from "@/models/ReflectionChatSession";
import { runReflectionController, runReflectionInterviewer } from "@/lib/ai/gemini";
import { getEffectiveReflectionPolicy } from "@/lib/reflection/policy";

export const runtime = "nodejs";

type TurnBody = { text: string };

function jsonError(status: number, error: string, details?: string) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status });
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("team_session")?.value;

    const payload = token ? verifyTeamSession(token) : null;
    const teamId = payload?.teamId;
    if (!teamId) {
      return jsonError(401, "Unauthorized", "Missing/invalid team_session cookie or payload.teamId");
    }

    const body = (await req.json().catch(() => null)) as TurnBody | null;
    const userText = (body?.text || "").trim();
    if (!userText) return jsonError(400, "Missing text");

    const session = await ReflectionChatSession.findOne({ teamId, status: "in_progress" });
    if (!session) {
      const ready = await ReflectionChatSession.findOne({ teamId, status: "ready_to_submit" }).select({ _id: 1 });
      if (ready) {
        return jsonError(409, "Reflection is ready to submit", "Use /confirm to submit or /reset to start over.");
      }
      return jsonError(409, "No active reflection session. Call /start first.");
    }

    session.messages.push({ role: "user", text: userText });
    session.currentIndex = (session.currentIndex || 0) + 1;

    // Use the snapshot. If missing (legacy sessions), snapshot now.
    if (!session.profileKey || typeof session.weeklyInstructionsSnapshot !== "string") {
      const effective = await getEffectiveReflectionPolicy();
      session.profileKey = session.profileKey || effective.profileKey || "default";
      session.weeklyInstructionsSnapshot = session.weeklyInstructionsSnapshot || effective.weeklyInstructions || "";
    }

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const recentSubmitted = await ReflectionChatSession.find({
      teamId,
      status: "submitted",
      updatedAt: { $gte: fourteenDaysAgo },
    })
      .sort({ updatedAt: -1 })
      .limit(3)
      .select({ aiSummary: 1 })
      .lean();

    const recentSummaries = recentSubmitted
      .map((r: any) => r?.aiSummary)
      .filter((s: any) => typeof s === "string" && s.trim().length > 0);

    const effective = await getEffectiveReflectionPolicy();
    const policy = {
      profile: {
        key: session.profileKey || effective.profileKey || "default",
        title: effective.profile.title,
        controllerAddendum: effective.profile.controllerAddendum,
      },
      weeklyInstructions: session.weeklyInstructionsSnapshot || "",
    };

    const controller = await runReflectionController({
      messages: session.messages,
      answers: session.answers,
      runningSummary: session.aiSummary || "",
      clarifyCount: session.clarifyCount || 0,
      turnCount: session.currentIndex || 0,
      maxTurns: 16,
      recentSummaries,
      policy,
    });

    session.aiSummary = controller.runningSummary;
    session.answers = controller.answers;
    session.clarifyCount = controller.clarifyCount;
    session.currentIndex = controller.turnCount;

    let assistantText = "";

    if (controller.readyToSubmit === true) {
      session.status = "ready_to_submit";
      assistantText =
        "סיימנו ✅ יש לי את כל מה שצריך לרפלקציה. עכשיו אפשר להגיש או לבטל ולהתחיל מחדש דרך הכפתורים למעלה.";
    } else {
      assistantText = await runReflectionInterviewer({
        messages: session.messages,
        nextIntent: controller.nextIntent,
      });
    }

    session.messages.push({ role: "model", text: assistantText });
    await session.save();

    return NextResponse.json({
      ok: true,
      assistantText,
      readyToSubmit: controller.readyToSubmit === true,
      status: session.status,
      runningSummary: "",
    });
  } catch (err: any) {
    console.error("reflection/turn error:", err);
    return jsonError(500, "Internal Server Error", err?.message || "Unknown");
  }
}
