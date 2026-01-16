import mongoose, { Model, Schema } from "mongoose";

export type ReflectionSettingsDoc = {
  singletonKey: "global";
  selectedProfileKey: string;
  weeklyInstructions: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const ReflectionSettingsSchema = new Schema<ReflectionSettingsDoc>(
  {
    singletonKey: { type: String, required: true, unique: true, index: true },
    selectedProfileKey: { type: String, default: "default" },
    weeklyInstructions: { type: String, default: "" },
  },
  { timestamps: true }
);

const ModelRef =
  (mongoose.models.ReflectionSettings as Model<ReflectionSettingsDoc>) ||
  mongoose.model<ReflectionSettingsDoc>("ReflectionSettings", ReflectionSettingsSchema);

export default ModelRef;
