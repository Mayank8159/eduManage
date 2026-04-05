import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IClass extends Document {
  name: string;
  section: string;
  subject: string;
  teacher: Types.ObjectId | null;
  students: Types.ObjectId[];
}

const classSchema = new Schema<IClass>(
  {
    name: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", default: null },
    students: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

classSchema.index({ name: 1, section: 1, subject: 1 }, { unique: true });

export const ClassModel = mongoose.model<IClass>("Class", classSchema);
