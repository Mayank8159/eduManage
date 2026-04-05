import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface ITeacherProfile extends Document {
  user: Types.ObjectId;
  employeeId: string;
  subjects: string[];
  assignedClasses: Types.ObjectId[];
  approved: boolean;
}

const teacherProfileSchema = new Schema<ITeacherProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    employeeId: { type: String, required: true, unique: true },
    subjects: [{ type: String, trim: true }],
    assignedClasses: [{ type: Schema.Types.ObjectId, ref: "Class" }],
    approved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const TeacherProfile = mongoose.model<ITeacherProfile>("TeacherProfile", teacherProfileSchema);
