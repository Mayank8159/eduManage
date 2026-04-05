import { Notification } from "../models/Notification";
import { getPagination } from "../utils/pagination";

export async function listNotifications(userId: string, pageRaw?: string, limitRaw?: string) {
  const { page, limit, skip } = getPagination(pageRaw, limitRaw);

  const [items, total] = await Promise.all([
    Notification.find({ toUser: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ toUser: userId }),
  ]);

  return { items, pagination: { page, limit, total } };
}
