import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IAttendance extends Document {
  student: Types.ObjectId;
  class: Types.ObjectId;
  date: Date;
  status: "present" | "absent";
  markedBy: Types.ObjectId;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["present", "absent"], required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, class: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>("Attendance", attendanceSchema);
