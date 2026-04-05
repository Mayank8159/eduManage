import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IMark extends Document {
  student: Types.ObjectId;
  class: Types.ObjectId;
  subject: string;
  score: number;
  maxScore: number;
  examType: string;
  createdBy: Types.ObjectId;
}

const markSchema = new Schema<IMark>(
  {
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    subject: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0 },
    maxScore: { type: Number, required: true, min: 1 },
    examType: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

markSchema.index({ student: 1, class: 1, subject: 1, examType: 1, createdAt: -1 });

export const Mark = mongoose.model<IMark>("Mark", markSchema);
