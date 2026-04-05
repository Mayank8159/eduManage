import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import { ROLES } from "../constants/roles";
import { asyncHandler } from "../utils/asyncHandler";
import {
  createMark,
  getClassStudentsWithMetrics,
  getTeacherClasses,
  predictStudent,
  upsertAttendance,
} from "../services/teacher.service";
import { validate } from "../middleware/validate";
import { logActivity } from "../services/activity.service";

const router = Router();

router.use(authenticate, authorize(ROLES.TEACHER));

router.get(
  "/classes",
  asyncHandler(async (req, res) => {
    const data = await getTeacherClasses(req.user!.id);
    res.json(data);
  })
);

router.get(
  "/classes/:classId/students",
  asyncHandler(async (req, res) => {
    const classId = String(req.params.classId);
    const data = await getClassStudentsWithMetrics(classId);
    if (!data) {
      return res.status(404).json({ message: "Class not found" });
    }

    return res.json(data);
  })
);

const attendanceSchema = z.object({
  body: z.object({
    student: z.string().min(24).max(24),
    classId: z.string().min(24).max(24),
    date: z.string(),
    status: z.enum(["present", "absent"]),
  }),
  params: z.object({}),
  query: z.object({}),
});

router.post(
  "/attendance",
  validate(attendanceSchema),
  asyncHandler(async (req, res) => {
    const attendance = await upsertAttendance({
      student: req.body.student,
      classId: req.body.classId,
      date: new Date(req.body.date),
      status: req.body.status,
      markedBy: req.user!.id,
    });

    await logActivity({
      actor: req.user!.id,
      role: req.user!.role,
      action: "UPLOAD_ATTENDANCE",
      module: "teacher",
      metadata: { classId: req.body.classId, studentId: req.body.student, status: req.body.status },
    });

    res.status(201).json(attendance);
  })
);

const markSchema = z.object({
  body: z.object({
    student: z.string().min(24).max(24),
    classId: z.string().min(24).max(24),
    subject: z.string().min(2),
    score: z.number().min(0),
    maxScore: z.number().min(1),
    examType: z.string().min(2),
  }),
  params: z.object({}),
  query: z.object({}),
});

router.post(
  "/marks",
  validate(markSchema),
  asyncHandler(async (req, res) => {
    const mark = await createMark({ ...req.body, createdBy: req.user!.id });

    await logActivity({
      actor: req.user!.id,
      role: req.user!.role,
      action: "UPLOAD_MARKS",
      module: "teacher",
      metadata: { classId: req.body.classId, studentId: req.body.student, subject: req.body.subject },
    });

    res.status(201).json(mark);
  })
);

router.get(
  "/classes/:classId/students/:studentId/predict",
  asyncHandler(async (req, res) => {
    const classId = String(req.params.classId);
    const studentId = String(req.params.studentId);
    const prediction = await predictStudent(classId, studentId);

    if (!prediction) {
      return res.status(404).json({ message: "Student not found" });
    }

    await logActivity({
      actor: req.user!.id,
      role: req.user!.role,
      action: "SIMULATE_STUDENT_PERFORMANCE",
      module: "teacher",
      metadata: { classId, studentId },
    });

    return res.json(prediction);
  })
);

router.post(
  "/classes/:classId/complete",
  asyncHandler(async (req, res) => {
    await logActivity({
      actor: req.user!.id,
      role: req.user!.role,
      action: "COMPLETE_CLASS",
      module: "teacher",
      metadata: { classId: req.params.classId },
    });

    res.json({ message: "Class completion logged" });
  })
);

export default router;
