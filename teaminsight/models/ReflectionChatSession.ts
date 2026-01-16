import mongoose, { Model, Schema } from "mongoose";

export type ChatMsgDoc = {
  role: "user" | "model";
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReflectionAnswerDoc = {
  topicId: string;
  prompt: string;
  answer: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReflectionColor = "green" | "yellow" | "red";

export type ReflectionChatSessionDoc = {
  teamId: string;
  sessionId: string;

  status: "in_progress" | "ready_to_submit" | "submitted";
  currentIndex: number;
  clarifyCount: number;

  messages: ChatMsgDoc[];
  answers: ReflectionAnswerDoc[];

  // Internal running summary (not shown to student)
  aiSummary: string;

  // New: profile + weekly instructions snapshot
  profileKey: string; // e.g. "default" | "strict" | ...
  weeklyInstructionsSnapshot: string; // can be empty

  // New: evaluation result (computed on confirm)
  reflectionScore: number | null; // 0..100
  reflectionColor: ReflectionColor | null;
  reflectionReasons: string[];

  // timestamp of when the reflection was submitted/confirmed
  submittedAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
};

const MessageSchema = new Schema<ChatMsgDoc>(
  {
    role: { type: String, enum: ["user", "model"], required: true },
    text: { type: String, required: true },
  },
  { timestamps: true, _id: false }
);

const AnswerSchema = new Schema<ReflectionAnswerDoc>(
  {
    topicId: { type: String, required: true },
    prompt: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true, _id: false }
);

const ReflectionChatSessionSchema = new Schema<ReflectionChatSessionDoc>(
  {
    teamId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },

    status: {
      type: String,
      enum: ["in_progress", "ready_to_submit", "submitted"],
      default: "in_progress",
      index: true,
    },

    currentIndex: { type: Number, default: 0 },
    clarifyCount: { type: Number, default: 0 },

    messages: { type: [MessageSchema], default: [] },
    answers: { type: [AnswerSchema], default: [] },

    aiSummary: { type: String, default: "" },

    // New: profile + weekly instructions snapshot
    profileKey: { type: String, default: "default", index: true },
    weeklyInstructionsSnapshot: { type: String, default: "" },

    // New: evaluation result (computed on confirm)
    reflectionScore: { type: Number, default: null, index: true },
    reflectionColor: {
      type: String,
      enum: ["green", "yellow", "red"],
      default: null,
      index: true,
    },
    reflectionReasons: { type: [String], default: [] },

    // New field (replaces ReflectionSubmission.submittedAt)
    submittedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true }
);

ReflectionChatSessionSchema.index({ teamId: 1, sessionId: 1 }, { unique: true });

// Helpful for "recent submissions by team" queries
ReflectionChatSessionSchema.index({ teamId: 1, submittedAt: -1 });

// Helpful for dashboards / filtering by color
ReflectionChatSessionSchema.index({ teamId: 1, reflectionColor: 1, submittedAt: -1 });

const ModelRef =
  (mongoose.models.ReflectionChatSession as Model<ReflectionChatSessionDoc>) ||
  mongoose.model<ReflectionChatSessionDoc>(
    "ReflectionChatSession",
    ReflectionChatSessionSchema
  );

export default ModelRef;
