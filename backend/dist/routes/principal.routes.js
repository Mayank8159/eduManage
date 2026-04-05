"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const roles_1 = require("../constants/roles");
const asyncHandler_1 = require("../utils/asyncHandler");
const principal_service_1 = require("../services/principal.service");
const ActivityLog_1 = require("../models/ActivityLog");
const pagination_1 = require("../utils/pagination");
const TeacherProfile_1 = require("../models/TeacherProfile");
const Class_1 = require("../models/Class");
const Notification_1 = require("../models/Notification");
const validate_1 = require("../middleware/validate");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, authorize_1.authorize)(roles_1.ROLES.PRINCIPAL));
router.get("/users", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { role, search, page, limit } = req.query;
    const data = await (0, principal_service_1.listUsers)(role, search, page, limit);
    res.json(data);
}));
router.get("/teacher-analytics", (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await (0, principal_service_1.teacherAnalytics)();
    res.json(data);
}));
router.get("/overview", (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await (0, principal_service_1.principalOverview)();
    res.json(data);
}));
router.get("/activity-trend", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days || 7), 3), 31);
    const data = await (0, principal_service_1.activityTrend)(days);
    res.json(data);
}));
router.get("/classes", (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const data = await (0, principal_service_1.listClasses)();
    res.json(data);
}));
router.get("/activity-logs", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { page, limit, action, module, search } = req.query;
    const { skip } = (0, pagination_1.getPagination)(page, limit);
    const pagination = (0, pagination_1.getPagination)(page, limit);
    const query = {};
    if (action)
        query.action = action;
    if (module)
        query.module = module;
    if (search)
        query.$or = [{ action: { $regex: search, $options: "i" } }, { module: { $regex: search, $options: "i" } }];
    const [items, total] = await Promise.all([
        ActivityLog_1.ActivityLog.find(query).populate("actor", "name email role").sort({ createdAt: -1 }).skip(skip).limit(pagination.limit),
        ActivityLog_1.ActivityLog.countDocuments(query),
    ]);
    res.json({ items, pagination: { page: pagination.page, limit: pagination.limit, total } });
}));
router.get("/reports", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const rawType = String(req.query.type || "weekly").toLowerCase();
    const type = rawType === "monthly" ? "monthly" : "weekly";
    const report = await (0, principal_service_1.generateReport)(type);
    res.json(report);
}));
const approveSchema = zod_1.z.object({
    body: zod_1.z.object({ approved: zod_1.z.boolean() }),
    params: zod_1.z.object({ teacherId: zod_1.z.string().min(24).max(24) }),
    query: zod_1.z.object({}),
});
router.patch("/teachers/:teacherId/approve", (0, validate_1.validate)(approveSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const teacherId = String(req.params.teacherId);
    const profile = await TeacherProfile_1.TeacherProfile.findOneAndUpdate({ user: teacherId }, { approved: req.body.approved }, { new: true });
    res.json({ message: "Teacher approval updated", profile });
}));
const assignSchema = zod_1.z.object({
    body: zod_1.z.object({ classId: zod_1.z.string().min(24).max(24) }),
    params: zod_1.z.object({ teacherId: zod_1.z.string().min(24).max(24) }),
    query: zod_1.z.object({}),
});
router.post("/teachers/:teacherId/assign-class", (0, validate_1.validate)(assignSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const teacherId = String(req.params.teacherId);
    const cls = await Class_1.ClassModel.findByIdAndUpdate(req.body.classId, { teacher: teacherId }, { new: true });
    if (!cls) {
        return res.status(404).json({ message: "Class not found" });
    }
    await TeacherProfile_1.TeacherProfile.findOneAndUpdate({ user: teacherId }, { $addToSet: { assignedClasses: req.body.classId } }, { new: true });
    await Notification_1.Notification.create({
        toUser: teacherId,
        title: "New Class Assignment",
        message: `You have been assigned to class ${cls?.name || ""} ${cls?.section || ""}`,
        type: "info",
        createdBy: req.user?.id,
    });
    res.json({ message: "Teacher assigned successfully", class: cls });
}));
exports.default = router;
