import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IStudentProfile extends Document {
  user: Types.ObjectId;
  rollNumber: string;
  class: Types.ObjectId;
  guardianName: string;
}

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    rollNumber: { type: String, required: true, unique: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    guardianName: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export const StudentProfile = mongoose.model<IStudentProfile>("StudentProfile", studentProfileSchema);
