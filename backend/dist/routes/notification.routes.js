"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const asyncHandler_1 = require("../utils/asyncHandler");
const notification_service_1 = require("../services/notification.service");
const Notification_1 = require("../models/Notification");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.get("/", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit } = req.query;
    const data = await (0, notification_service_1.listNotifications)(req.user.id, page, limit);
    res.json(data);
}));
router.patch("/:notificationId/read", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const notification = await Notification_1.Notification.findOneAndUpdate({ _id: req.params.notificationId, toUser: req.user.id }, { isRead: true }, { new: true });
    if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
    }
    return res.json(notification);
}));
exports.default = router;
