import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ["green", "yellow", "red"],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  emailTo: {
    type: String,
    required: true
  },
  emailStatus: {
    type: String,
    enum: ["pending", "sent", "failed"],
    default: "pending"
  }
}, {
  timestamps: true
});

export default mongoose.models.Alert ||
  mongoose.model("Alert", AlertSchema);
