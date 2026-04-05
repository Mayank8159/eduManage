import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface INotification extends Document {
  toUser: Types.ObjectId;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  isRead: boolean;
  createdBy: Types.ObjectId;
}

const notificationSchema = new Schema<INotification>(
  {
    toUser: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: { type: String, enum: ["info", "warning", "success"], default: "info" },
    isRead: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
