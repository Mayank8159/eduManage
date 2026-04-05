import mongoose, { Schema, type Document, type Types } from "mongoose";

export interface IActivityLog extends Document {
  actor: Types.ObjectId;
  role: string;
  action: string;
  module: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, required: true },
    action: { type: String, required: true },
    module: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

activityLogSchema.index({ actor: 1, createdAt: -1 });

export const ActivityLog = mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);
