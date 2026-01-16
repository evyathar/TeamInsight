import mongoose, { Model, Schema } from "mongoose";

export type ReflectionProfileDoc = {
  key: string;
  title: string;
  description: string;
  controllerAddendum: string;
  evaluatorAddendum: string;
  greenMin: number;
  redMax: number;
  createdAt?: Date;
  updatedAt?: Date;
};

const ReflectionProfileSchema = new Schema<ReflectionProfileDoc>(
  {
    key: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    controllerAddendum: { type: String, default: "" },
    evaluatorAddendum: { type: String, default: "" },
    greenMin: { type: Number, default: 75 },
    redMax: { type: Number, default: 45 },
  },
  { timestamps: true }
);

const ModelRef =
  (mongoose.models.ReflectionProfile as Model<ReflectionProfileDoc>) ||
  mongoose.model<ReflectionProfileDoc>("ReflectionProfile", ReflectionProfileSchema);

export default ModelRef;
