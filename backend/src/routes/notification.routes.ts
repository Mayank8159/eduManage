import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { listNotifications } from "../services/notification.service";
import { Notification } from "../models/Notification";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query as Record<string, string>;
    const data = await listNotifications(req.user!.id, page, limit);
    res.json(data);
  })
);

router.patch(
  "/:notificationId/read",
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, toUser: req.user!.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json(notification);
  })
);

export default router;
