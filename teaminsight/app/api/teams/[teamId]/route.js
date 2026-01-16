import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import Alert from "@/models/Alert";
import Lecturer from "@/models/Lecturer";

const ALERT_STATUSES = new Set(["yellow", "red"]); // abnormal states

/* =========================
   GET /api/teams/[teamId]
   ========================= */
export async function GET(_req, context) {
  try {
    await connectDB();

    // IMPORTANT: params is a Promise in App Router
    const { teamId } = await context.params;

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    const team = await Team.findOne({ teamId }).lean();

    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: true, team },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}

/* =========================
   PUT /api/teams/[teamId]
   ========================= */
export async function PUT(request, context) {
  try {
    await connectDB();

    // IMPORTANT: params is a Promise
    const { teamId } = await context.params;

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    const updates = await request.json();

    const team = await Team.findOne({ teamId });
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    const prevStatus = team.status;

    /* Controlled updates only */
    if (typeof updates.projectName === "string") {
      team.projectName = updates.projectName;
    }

    if (typeof updates.accessCode === "string") {
      team.accessCode = updates.accessCode;
    }

    if (typeof updates.contactEmail === "string") {
      team.contactEmail = updates.contactEmail;
    }

    if (Array.isArray(updates.members)) {
      team.members = updates.members;
    }

    if (
      typeof updates.status === "string" &&
      ["green", "yellow", "red"].includes(updates.status)
    ) {
      team.status = updates.status;
    }

    await team.save();

    /* Create alert only if status changed to abnormal */
    if (
      team.status !== prevStatus &&
      ALERT_STATUSES.has(team.status)
    ) {
      const lecturer = await Lecturer.findOne().lean();

      await Alert.create({
        teamId: team.teamId,
        severity: team.status,
        message: `Team status changed from ${prevStatus} to ${team.status}`,
        emailTo: lecturer?.email || "",
        emailStatus: "pending",
      });
    }

    return NextResponse.json(
      { ok: true, teamId: team.teamId },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
  
}

/* =========================
   DELETE /api/teams/[teamId]
   ========================= */
export async function DELETE(_req, context) {
  try {
    await connectDB();

    // IMPORTANT: params is a Promise in App Router (same as GET/PUT)
    const { teamId } = await context.params;

    if (!teamId) {
      return NextResponse.json(
        { error: "teamId is required" },
        { status: 400 }
      );
    }

    const deleted = await Team.findOneAndDelete({ teamId: String(teamId).trim() });

    if (!deleted) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}

