import { GoogleGenAI } from "@google/genai";
import {
  REFLECTION_CONTROLLER_PROMPT,
  REFLECTION_INTERVIEWER_PROMPT,
  REFLECTION_FINAL_SUMMARY_PROMPT,
  REFLECTION_EVALUATION_PROMPT,
} from "./reflectionPrompts";
import { REFLECTION_TOPICS } from "@/lib/reflection/topics";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

const ai = new GoogleGenAI({ apiKey });

export type ChatMsg = { role: "user" | "model"; text: string };

export type ReflectionAnswer = {
  topicId: string;
  prompt: string;
  answer: string;
};

export type NextIntent = {
  kind: "clarify_current" | "advance_topic" | "wrap_up";
  topicId: string | null;
  anchor: string;
  styleNote: string;
  questions: string[];
};

export type ReflectionPolicy = {
  profile: {
    key: string;
    title?: string;
    controllerAddendum?: string;
    evaluatorAddendum?: string;
  };
  weeklyInstructions: string;
};

export type ControllerInput = {
  messages: ChatMsg[];
  answers: ReflectionAnswer[];
  runningSummary: string;
  clarifyCount: number;
  turnCount: number;
  maxTurns: number;
  recentSummaries: string[];

  // New: policy influences the controller behavior (profile + weekly instructions)
  // Optional so you won't break existing calls immediately.
  policy?: ReflectionPolicy;
};

export type ControllerResult = {
  runningSummary: string;
  answers: ReflectionAnswer[];
  nextIntent: NextIntent;
  readyToSubmit: boolean;
  clarifyCount: number;
  turnCount: number;
};

function stripCodeFences(s: string) {
  const t = (s || "").trim();

  if (t.startsWith("```")) {
    // Remove opening ```lang? and closing ```
    return t
      .replace(/^```[a-zA-Z]*\n?/, "")
      .replace(/```[\s]*$/, "")
      .trim();
  }

  return t;
}

function safeParseController(raw: string, fallback: ControllerResult): ControllerResult {
  const cleaned = stripCodeFences(raw);

  try {
    const obj = JSON.parse(cleaned);
    if (!obj || typeof obj !== "object") return fallback;

    const ni = (obj as any).nextIntent;
    if (!ni || typeof ni !== "object") return fallback;

    const kind = ni.kind;
    const validKind: NextIntent["kind"] =
      kind === "clarify_current" || kind === "advance_topic" || kind === "wrap_up"
        ? kind
        : fallback.nextIntent.kind;

    const questionsRaw = Array.isArray(ni.questions) ? ni.questions : [];
    const questions = questionsRaw
      .filter((q: any) => typeof q === "string")
      .map((q: string) => q.trim())
      .filter(Boolean)
      .slice(0, 2);

    // Allow empty questions only for wrap_up
    if (questions.length === 0 && validKind !== "wrap_up") return fallback;

    return {
      runningSummary:
        typeof (obj as any).runningSummary === "string"
          ? (obj as any).runningSummary.trim()
          : fallback.runningSummary,

      answers: Array.isArray((obj as any).answers) ? (obj as any).answers : fallback.answers,

      nextIntent: {
        kind: validKind,
        topicId: typeof ni.topicId === "string" ? ni.topicId : null,
        anchor: typeof ni.anchor === "string" ? ni.anchor.trim() : fallback.nextIntent.anchor,
        styleNote: typeof ni.styleNote === "string" ? ni.styleNote.trim() : "",
        questions,
      },

      readyToSubmit: (obj as any).readyToSubmit === true,
      clarifyCount: Number.isFinite((obj as any).clarifyCount)
        ? (obj as any).clarifyCount
        : fallback.clarifyCount,
      turnCount: Number.isFinite((obj as any).turnCount) ? (obj as any).turnCount : fallback.turnCount,
    };
  } catch {
    return fallback;
  }
}

function defaultPolicy(): ReflectionPolicy {
  return {
    profile: {
      key: "default",
      title: "Default",
      controllerAddendum: "",
      evaluatorAddendum: "",
    },
    weeklyInstructions: "",
  };
}

export async function runReflectionController(input: ControllerInput): Promise<ControllerResult> {
  const policy = input.policy ?? defaultPolicy();

  const payload = JSON.stringify({
    ...input,
    topics: REFLECTION_TOPICS,
    policy,
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user" as const, parts: [{ text: REFLECTION_CONTROLLER_PROMPT }] },
      { role: "user" as const, parts: [{ text: payload }] },
    ],
  });

  const fallback: ControllerResult = {
    runningSummary: input.runningSummary || "",
    answers: input.answers || [],
    nextIntent: {
      kind: "advance_topic",
      topicId: "achievements",
      anchor: "יאללה נתחיל מהשבוע שלכם",
      styleNote: "short open question",
      questions: ["מה התוצר הכי משמעותי שהשלמתם השבוע?"],
    },
    readyToSubmit: false,
    clarifyCount: input.clarifyCount || 0,
    turnCount: input.turnCount || 0,
  };

  return safeParseController(response.text ?? "{}", fallback);
}

export async function runReflectionInterviewer(args: {
  messages: ChatMsg[];
  nextIntent: NextIntent;
}): Promise<string> {
  const payload = JSON.stringify(args);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user" as const, parts: [{ text: REFLECTION_INTERVIEWER_PROMPT }] },
      { role: "user" as const, parts: [{ text: payload }] },
    ],
  });

  return (response.text ?? "").trim() || "קיבלתי. אפשר לשתף עוד קצת?";
}

export async function runReflectionFinalSummary(input: {
  answers: ReflectionAnswer[];
  runningSummary: string;
}): Promise<string> {
  const payload = JSON.stringify(input);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user" as const, parts: [{ text: REFLECTION_FINAL_SUMMARY_PROMPT }] },
      { role: "user" as const, parts: [{ text: payload }] },
    ],
  });

  return (response.text ?? "").trim();
}

export type ReflectionEval = {
  quality: number; // 0..10
  risk: number; // 0..10 (higher = worse)
  compliance: number; // 0..10
  reasons: string[]; // short bullets in Hebrew
};

function clamp0to10(x: any): number {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, n));
}

export async function runReflectionEvaluation(input: {
  summary: string;
  answers: ReflectionAnswer[];
  policy?: ReflectionPolicy;
}): Promise<ReflectionEval> {
  const policy = input.policy ?? defaultPolicy();

  const payload = JSON.stringify({
    summary: input.summary,
    answers: input.answers,
    policy,
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { role: "user" as const, parts: [{ text: REFLECTION_EVALUATION_PROMPT }] },
      { role: "user" as const, parts: [{ text: payload }] },
    ],
  });

  const raw = stripCodeFences(response.text ?? "{}");

  try {
    const obj = JSON.parse(raw);

    const reasons = Array.isArray(obj?.reasons)
      ? obj.reasons.filter((s: any) => typeof s === "string").map((s: string) => s.trim()).filter(Boolean).slice(0, 5)
      : [];

    return {
      quality: clamp0to10(obj?.quality),
      risk: clamp0to10(obj?.risk),
      compliance: clamp0to10(obj?.compliance),
      reasons: reasons.length > 0 ? reasons : ["לא נמצאו סיבות מפורטות — ניתוח בסיסי בוצע."],
    };
  } catch {
    return {
      quality: 5,
      risk: 5,
      compliance: 5,
      reasons: ["לא הצלחתי לנתח בוודאות — הוחזר סיווג ברירת מחדל."],
    };
  }
}
