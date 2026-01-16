import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Alert from "@/models/Alert";
import Team from "@/models/Team";
import Lecturer from "@/models/Lecturer";
import { sendMail } from "@/lib/mailer";


export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");

    const filter = teamId ? { teamId } : {};
    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).lean();

    return NextResponse.json({ ok: true, alerts }, { status: 200 });
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
    const { teamId, severity, message } = await request.json();

    if (!teamId || !severity || !message) {
      return NextResponse.json(
        { error: "teamId, severity and message are required" },
        { status: 400 }
      );
    }

    const teamExists = await Team.exists({ teamId });
    if (!teamExists) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    const lecturer = await Lecturer.findOne().lean();
    const emailTo = lecturer?.email || "";

    const created = await Alert.create({
      teamId,
      severity, // must match your schema enum
      message,
      emailTo,
      emailStatus: "pending",
    });


    if (severity === "red" && emailTo) {
      try {
        await sendMail(
          emailTo,
          `Critical alert for team ${teamId}`,
          message
        );
        await Alert.findByIdAndUpdate(created._id, {
          emailStatus: "sent",
        });
      } catch {
        await Alert.findByIdAndUpdate(created._id, {
          emailStatus: "failed",
        });
      }
    }


    return NextResponse.json({ ok: true, alertId: created._id }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error", details: String(err?.message || err) },
      { status: 500 }
    );
  }
}
