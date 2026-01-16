import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ReflectionProfile from "@/models/ReflectionProfile";
import ReflectionSettings from "@/models/ReflectionSettings";

export const runtime = "nodejs";

function jsonError(status: number, error: string, details?: string) {
  return NextResponse.json({ error, ...(details ? { details } : {}) }, { status });
}

async function ensureDefaults() {
  const defaults = [
    {
      key: "default",
      title: "Default",
      description: "Balanced: normal probing + normal thresholds.",
      controllerAddendum: "Sensitivity: normal. Ask for concrete examples.",
      evaluatorAddendum: "Sensitivity: normal. Balanced scoring.",
      greenMin: 75,
      redMax: 45,
    },
    {
      key: "strict",
      title: "Strict",
      description: "More demanding: higher bar for green.",
      controllerAddendum: "Sensitivity: strict. Do not accept vague answers.",
      evaluatorAddendum: "Sensitivity: strict. Penalize missing specifics.",
      greenMin: 85,
      redMax: 55,
    },
    {
      key: "risk_focus",
      title: "Risk Focus",
      description: "Focus on blockers/risks and mitigation.",
      controllerAddendum: "Sensitivity: risk-focused. Ask for blockers and mitigation.",
      evaluatorAddendum: "Sensitivity: risk-focused. Weak mitigation reduces score.",
      greenMin: 78,
      redMax: 48,
    },
    {
      key: "gentle",
      title: "Gentle",
      description: "Supportive: lower thresholds, still asks for details.",
      controllerAddendum: "Sensitivity: gentle. Ask for details, keep it supportive.",
      evaluatorAddendum: "Sensitivity: gentle. Avoid harsh penalties for minor gaps.",
      greenMin: 70,
      redMax: 35,
    },
  ];

  for (const p of defaults) {
    await ReflectionProfile.updateOne({ key: p.key }, { $setOnInsert: p }, { upsert: true });
  }

  await ReflectionSettings.updateOne(
    { singletonKey: "global" },
    { $setOnInsert: { singletonKey: "global", selectedProfileKey: "default", weeklyInstructions: "" } },
    { upsert: true }
  );
}

export async function GET() {
  try {
    await connectDB();
    await ensureDefaults();

    const profiles = await ReflectionProfile.find({})
      .select({ key: 1, title: 1, description: 1, greenMin: 1, redMax: 1 })
      .sort({ key: 1 })
      .lean();

    return NextResponse.json({ ok: true, profiles });
  } catch (err: any) {
    console.error("GET /api/lecturer/reflection/profiles error:", err);
    return jsonError(500, "Internal Server Error", err?.message || "Unknown");
  }
}
