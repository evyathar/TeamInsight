import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Announcement from "@/models/Announcement";

export async function POST(request) {
  try {
    await connectDB();
    const { title, body, targetTeams } = await request.json();

    if (!title || !body || !targetTeams) {
      return NextResponse.json(
        { error: "title, body and targetTeams are required" },
        { status: 400 }
      );
    }

    const created = await Announcement.create({ title, body, targetTeams });
    return NextResponse.json(
      { ok: true, announcementId: created._id },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    // If teamId provided: return announcements targeting "all" OR that teamId
    const filter = teamId
      ? { $or: [{ targetTeams: "all" }, { targetTeams: teamId }, { targetTeams: { $in: [teamId] } }] }
      : {}; // lecturer view: all

    const announcements = await Announcement.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ ok: true, announcements }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
