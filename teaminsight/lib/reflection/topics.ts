export type ReflectionTopic = {
  id: string;
  title: string;
  guidance: string;
};

export const REFLECTION_TOPICS: ReflectionTopic[] = [
  {
    id: "achievements",
    title: "הישגים ותוצרים",
    guidance: "Concrete deliverables: feature/PR/demo/fix/deploy. Include what was built and evidence.",
  },
  {
    id: "wins",
    title: "מה עבד טוב",
    guidance: "What helped you succeed? Practices, communication, planning. Give one concrete example.",
  },
  {
    id: "pain_points",
    title: "מה לא עבד",
    guidance: "What went poorly? Misalignment, rework, unclear tasks, bugs. Give one concrete example.",
  },
  {
    id: "blockers",
    title: "חסמים",
    guidance: "What blocked progress? Technical, dependencies, communication, time. Include type and impact.",
  },
  {
    id: "decisions",
    title: "החלטות חשובות",
    guidance: "Key decision made and why. One decision is enough if concrete.",
  },
  {
    id: "risks",
    title: "סיכונים לשבוע הבא",
    guidance: "What might fail next week? Add one mitigation idea.",
  },
  {
    id: "next_actions",
    title: "פעולות לשבוע הבא",
    guidance: "Exactly 3 concrete actions: what + owner + target (date/week).",
  },
];
