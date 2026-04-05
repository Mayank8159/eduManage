"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const roles_1 = require("../constants/roles");
const asyncHandler_1 = require("../utils/asyncHandler");
const teacher_service_1 = require("../services/teacher.service");
const validate_1 = require("../middleware/validate");
const activity_service_1 = require("../services/activity.service");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate, (0, authorize_1.authorize)(roles_1.ROLES.TEACHER));
router.get("/classes", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const data = await (0, teacher_service_1.getTeacherClasses)(req.user.id);
    res.json(data);
}));
router.get("/classes/:classId/students", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const classId = String(req.params.classId);
    const data = await (0, teacher_service_1.getClassStudentsWithMetrics)(classId);
    if (!data) {
        return res.status(404).json({ message: "Class not found" });
    }
    return res.json(data);
}));
const attendanceSchema = zod_1.z.object({
    body: zod_1.z.object({
        student: zod_1.z.string().min(24).max(24),
        classId: zod_1.z.string().min(24).max(24),
        date: zod_1.z.string(),
        status: zod_1.z.enum(["present", "absent"]),
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
router.post("/attendance", (0, validate_1.validate)(attendanceSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const attendance = await (0, teacher_service_1.upsertAttendance)({
        student: req.body.student,
        classId: req.body.classId,
        date: new Date(req.body.date),
        status: req.body.status,
        markedBy: req.user.id,
    });
    await (0, activity_service_1.logActivity)({
        actor: req.user.id,
        role: req.user.role,
        action: "UPLOAD_ATTENDANCE",
        module: "teacher",
        metadata: { classId: req.body.classId, studentId: req.body.student, status: req.body.status },
    });
    res.status(201).json(attendance);
}));
const markSchema = zod_1.z.object({
    body: zod_1.z.object({
        student: zod_1.z.string().min(24).max(24),
        classId: zod_1.z.string().min(24).max(24),
        subject: zod_1.z.string().min(2),
        score: zod_1.z.number().min(0),
        maxScore: zod_1.z.number().min(1),
        examType: zod_1.z.string().min(2),
    }),
    params: zod_1.z.object({}),
    query: zod_1.z.object({}),
});
router.post("/marks", (0, validate_1.validate)(markSchema), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const mark = await (0, teacher_service_1.createMark)({ ...req.body, createdBy: req.user.id });
    await (0, activity_service_1.logActivity)({
        actor: req.user.id,
        role: req.user.role,
        action: "UPLOAD_MARKS",
        module: "teacher",
        metadata: { classId: req.body.classId, studentId: req.body.student, subject: req.body.subject },
    });
    res.status(201).json(mark);
}));
router.get("/classes/:classId/students/:studentId/predict", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const classId = String(req.params.classId);
    const studentId = String(req.params.studentId);
    const prediction = await (0, teacher_service_1.predictStudent)(classId, studentId);
    if (!prediction) {
        return res.status(404).json({ message: "Student not found" });
    }
    await (0, activity_service_1.logActivity)({
        actor: req.user.id,
        role: req.user.role,
        action: "SIMULATE_STUDENT_PERFORMANCE",
        module: "teacher",
        metadata: { classId, studentId },
    });
    return res.json(prediction);
}));
router.post("/classes/:classId/complete", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await (0, activity_service_1.logActivity)({
        actor: req.user.id,
        role: req.user.role,
        action: "COMPLETE_CLASS",
        module: "teacher",
        metadata: { classId: req.params.classId },
    });
    res.json({ message: "Class completion logged" });
}));
exports.default = router;
