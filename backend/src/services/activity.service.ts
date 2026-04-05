import { ActivityLog } from "../models/ActivityLog";
import type { Role } from "../constants/roles";

export async function logActivity(input: {
  actor: string;
  role: Role;
  action: string;
  module: string;
  metadata?: Record<string, unknown>;
}) {
  await ActivityLog.create(input);
}
