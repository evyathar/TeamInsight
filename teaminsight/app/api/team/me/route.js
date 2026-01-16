import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";
import { verifyTeamSession } from "@/lib/teamSession";

const COOKIE_NAME = "team_session";

export async function GET() {
  try {
    
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    const session = verifyTeamSession(token);

    if (!session?.teamId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const team = await Team.findOne({ teamId: session.teamId }).lean();

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        ok: true,
        team: {
          teamId: team.teamId,
          projectName: team.projectName,
          status: team.status,
          members: team.members,
          contactEmail: team.contactEmail,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
