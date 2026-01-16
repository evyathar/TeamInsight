import mongoose from "mongoose";

const CsvStudentListSchema = new mongoose.Schema(
  {
    memberId: {
      type: String,
      required: true,
      unique: true,   
      index: true
    },
    displayName: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.models.CsvStudentList ||
  mongoose.model("CsvStudentList", CsvStudentListSchema);
