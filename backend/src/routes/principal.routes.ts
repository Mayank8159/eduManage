import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import { ROLES } from "../constants/roles";
import { asyncHandler } from "../utils/asyncHandler";
import {
  activityTrend,
  generateReport,
  listClasses,
  listUsers,
  principalOverview,
  teacherAnalytics,
} from "../services/principal.service";
import { ActivityLog } from "../models/ActivityLog";
import { getPagination } from "../utils/pagination";
import { TeacherProfile } from "../models/TeacherProfile";
import { ClassModel } from "../models/Class";
import { Notification } from "../models/Notification";
import { validate } from "../middleware/validate";

const router = Router();

router.use(authenticate, authorize(ROLES.PRINCIPAL));

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { role, search, page, limit } = req.query as Record<string, string>;
    const data = await listUsers(role, search, page, limit);
    res.json(data);
  })
);

router.get(
  "/teacher-analytics",
  asyncHandler(async (_req, res) => {
    const data = await teacherAnalytics();
    res.json(data);
  })
);

router.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    const data = await principalOverview();
    res.json(data);
  })
);

router.get(
  "/activity-trend",
  asyncHandler(async (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days || 7), 3), 31);
    const data = await activityTrend(days);
    res.json(data);
  })
);

router.get(
  "/classes",
  asyncHandler(async (_req, res) => {
    const data = await listClasses();
    res.json(data);
  })
);

router.get(
  "/activity-logs",
  asyncHandler(async (req, res) => {
    const { page, limit, action, module, search } = req.query as Record<string, string>;
    const { skip } = getPagination(page, limit);
    const pagination = getPagination(page, limit);

    const query: Record<string, unknown> = {};
    if (action) query.action = action;
    if (module) query.module = module;
    if (search) query.$or = [{ action: { $regex: search, $options: "i" } }, { module: { $regex: search, $options: "i" } }];

    const [items, total] = await Promise.all([
      ActivityLog.find(query).populate("actor", "name email role").sort({ createdAt: -1 }).skip(skip).limit(pagination.limit),
      ActivityLog.countDocuments(query),
    ]);

    res.json({ items, pagination: { page: pagination.page, limit: pagination.limit, total } });
  })
);

router.get(
  "/reports",
  asyncHandler(async (req, res) => {
    const rawType = String(req.query.type || "weekly").toLowerCase();
    const type: "weekly" | "monthly" = rawType === "monthly" ? "monthly" : "weekly";
    const report = await generateReport(type);
    res.json(report);
  })
);

const approveSchema = z.object({
  body: z.object({ approved: z.boolean() }),
  params: z.object({ teacherId: z.string().min(24).max(24) }),
  query: z.object({}),
});

router.patch(
  "/teachers/:teacherId/approve",
  validate(approveSchema),
  asyncHandler(async (req, res) => {
    const teacherId = String(req.params.teacherId);
    const profile = await TeacherProfile.findOneAndUpdate({ user: teacherId }, { approved: req.body.approved }, { new: true });
    res.json({ message: "Teacher approval updated", profile });
  })
);

const assignSchema = z.object({
  body: z.object({ classId: z.string().min(24).max(24) }),
  params: z.object({ teacherId: z.string().min(24).max(24) }),
  query: z.object({}),
});

router.post(
  "/teachers/:teacherId/assign-class",
  validate(assignSchema),
  asyncHandler(async (req, res) => {
    const teacherId = String(req.params.teacherId);
    const cls = await ClassModel.findByIdAndUpdate(req.body.classId, { teacher: teacherId }, { new: true });

    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    await TeacherProfile.findOneAndUpdate(
      { user: teacherId },
      { $addToSet: { assignedClasses: req.body.classId } },
      { new: true }
    );

    await Notification.create({
      toUser: teacherId,
      title: "New Class Assignment",
      message: `You have been assigned to class ${cls?.name || ""} ${cls?.section || ""}`,
      type: "info",
      createdBy: req.user?.id,
    });

    res.json({ message: "Teacher assigned successfully", class: cls });
  })
);

export default router;
