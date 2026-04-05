"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listNotifications = listNotifications;
const Notification_1 = require("../models/Notification");
const pagination_1 = require("../utils/pagination");
async function listNotifications(userId, pageRaw, limitRaw) {
    const { page, limit, skip } = (0, pagination_1.getPagination)(pageRaw, limitRaw);
    const [items, total] = await Promise.all([
        Notification_1.Notification.find({ toUser: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Notification_1.Notification.countDocuments({ toUser: userId }),
    ]);
    return { items, pagination: { page, limit, total } };
}
