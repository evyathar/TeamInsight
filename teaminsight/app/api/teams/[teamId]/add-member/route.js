import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import CsvStudentList from "@/models/CsvStudentList";

/**
 * POST
 * Adds a single member to a team.
 * Optionally removes the member from CsvStudentList if coming from CSV.
 */
export async function POST(request, context) {
  try {
    await connectDB();

    const { teamId } = await context.params;
    const { memberId, displayName, fromCsv } = await request.json();

    if (!teamId || !memberId || !displayName) {
      return NextResponse.json(
        { error: "teamId, memberId and displayName are required" },
        { status: 400 }
      );
    }

    const team = await Team.findOne({ teamId });
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Prevent duplicate members
    const alreadyExists = team.members.some(
      (m) => m.memberId === memberId
    );

    if (alreadyExists) {
      return NextResponse.json(
        { error: "Member already exists in team" },
        { status: 409 }
      );
    }

    // Add member to team
    team.members.push({
      memberId,
      displayName
    });

    await team.save();

    // Remove from CSV list if needed
    if (fromCsv === true) {
      await CsvStudentList.deleteOne({ memberId });
    }

    return NextResponse.json(
      { ok: true, teamId },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
