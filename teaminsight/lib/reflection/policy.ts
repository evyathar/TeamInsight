import ReflectionProfile from "@/models/ReflectionProfile";
import ReflectionSettings from "@/models/ReflectionSettings";

export type EffectivePolicy = {
  profileKey: string;
  profile: {
    key: string;
    title: string;
    description: string;
    controllerAddendum: string;
    evaluatorAddendum: string;
    greenMin: number;
    redMax: number;
  };
  weeklyInstructions: string;
};

export async function ensureDefaultReflectionProfiles() {
  const defaults = [
    {
      key: "default",
      title: "Default",
      description: "Balanced: normal probing + normal color thresholds.",
      controllerAddendum:
        "Sensitivity: normal. Push for concrete examples, but keep the flow friendly and not aggressive.",
      evaluatorAddendum:
        "Sensitivity: normal. Weigh both quality and risk in a balanced way.",
      greenMin: 75,
      redMax: 45,
    },
    {
      key: "strict",
      title: "Strict",
      description: "More demanding: higher bar for green, more likely to mark yellow/red.",
      controllerAddendum:
        "Sensitivity: strict. Do not accept vague answers. Require names (feature/file/route/PR) and measurable details.",
      evaluatorAddendum:
        "Sensitivity: strict. Penalize missing specifics, unclear next actions, and repeated blockers.",
      greenMin: 85,
      redMax: 55,
    },
    {
      key: "risk_focus",
      title: "Risk Focus",
      description: "Focus on blockers/risks: prioritizes mitigation and ownership.",
      controllerAddendum:
        "Sensitivity: risk-focused. Ask early about blockers/risks and require mitigation + owner + target date.",
      evaluatorAddendum:
        "Sensitivity: risk-focused. If risks are high or mitigation is weak, score should drop noticeably.",
      greenMin: 78,
      redMax: 48,
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

export async function getEffectiveReflectionPolicy(): Promise<EffectivePolicy> {
  await ensureDefaultReflectionProfiles();

  const settings =
    (await ReflectionSettings.findOne({ singletonKey: "global" }).lean()) ||
    ({ selectedProfileKey: "default", weeklyInstructions: "" } as any);

  const profileKey = (settings.selectedProfileKey || "default").trim() || "default";
  const weeklyInstructions = (settings.weeklyInstructions || "").trim();

  const profileDoc = await ReflectionProfile.findOne({ key: profileKey }).lean();
  const profile =
    profileDoc ||
    (await ReflectionProfile.findOne({ key: "default" }).lean()) ||
    ({
      key: "default",
      title: "Default",
      description: "Fallback",
      controllerAddendum: "",
      evaluatorAddendum: "",
      greenMin: 75,
      redMax: 45,
    } as any);

  return {
    profileKey: profile.key,
    profile: {
      key: profile.key,
      title: profile.title,
      description: profile.description,
      controllerAddendum: profile.controllerAddendum || "",
      evaluatorAddendum: profile.evaluatorAddendum || "",
      greenMin: Number(profile.greenMin ?? 75),
      redMax: Number(profile.redMax ?? 45),
    },
    weeklyInstructions,
  };
}
