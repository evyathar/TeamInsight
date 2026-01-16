import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Team from "@/models/Team";

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get("sortBy") || "teamId"; // teamId | projectName | status | createdAt
    const order = (searchParams.get("order") || "asc").toLowerCase() === "desc" ? -1 : 1;

    const allowed = new Set(["teamId", "projectName", "status", "createdAt"]);
    const sortField = allowed.has(sortBy) ? sortBy : "teamId";

    const teams = await Team.find({})
      .select("teamId projectName status contactEmail members createdAt")
      .sort({ [sortField]: order })
      .lean();

    return NextResponse.json({ ok: true, teams }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const {
      teamId,
      projectName,
      accessCode,
      contactEmail,
      members = [],
      status = "green",
    } = body;

    if (!teamId || !projectName || !accessCode || !contactEmail) {
      return NextResponse.json(
        { error: "teamId, projectName, accessCode, contactEmail are required" },
        { status: 400 }
      );
    }

    const exists = await Team.exists({ teamId });
    if (exists) {
      return NextResponse.json({ error: "teamId already exists" }, { status: 409 });
    }

    const created = await Team.create({
      teamId,
      projectName,
      accessCode,
      contactEmail,
      members,
      status,
    });

    return NextResponse.json(
      { ok: true, teamId: created.teamId },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
