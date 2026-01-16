import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  }
}, { _id: false });

const TeamSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
    unique: true
  },
  projectName: {
    type: String,
    required: true
  },
  accessCode: {
    type: String,
    required: true
  },
  contactEmail: {
    type: String,
    required: true
  },
  members: {
    type: [MemberSchema],
    default: []
  },
  status: {
    type: String,
    enum: ["green", "yellow", "red"],
    default: "green"
  }
}, {
  timestamps: true
});

export default mongoose.models.Team ||
  mongoose.model("Team", TeamSchema);
