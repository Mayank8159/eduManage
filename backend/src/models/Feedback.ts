import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IFeedback extends Document {
  teacher: Types.ObjectId;
  student: Types.ObjectId;
  comment: string;
  rating: number;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    student: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comment: { type: String, trim: true, default: "" },
    rating: { type: Number, required: true, min: 1, max: 5 },
  },
  { timestamps: true }
);

export const Feedback = mongoose.model<IFeedback>("Feedback", feedbackSchema);
