import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { ActivityLog } from "../models/ActivityLog";
import { Attendance } from "../models/Attendance";
import { ClassModel } from "../models/Class";
import { Feedback } from "../models/Feedback";
import { Mark } from "../models/Mark";
import { TeacherProfile } from "../models/TeacherProfile";
import { User } from "../models/User";
import { getPagination } from "../utils/pagination";
import { teacherPerformanceScore } from "../utils/scoring";

export async function listUsers(role?: string, search?: string, pageRaw?: string, limitRaw?: string) {
  const { page, limit, skip } = getPagination(pageRaw, limitRaw);
  const query: Record<string, unknown> = {};

  if (role) query.role = role;
  if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];

  const [items, total] = await Promise.all([
    User.find(query).select("name email role isActive createdAt").skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(query),
  ]);

  return { items, pagination: { page, limit, total } };
}

export async function teacherAnalytics() {
  const teachers = await User.find({ role: "teacher" }).select("name email");

  const result = await Promise.all(
    teachers.map(async (teacher) => {
      const profile = await TeacherProfile.findOne({ user: teacher._id });
      const totalAssignedClasses = profile?.assignedClasses.length || 0;
      const attendanceMarked = await Attendance.countDocuments({ markedBy: teacher._id });
      const feedback = await Feedback.find({ teacher: teacher._id });

      const uniqueClassesCompleted = await ActivityLog.distinct("metadata.classId", {
        actor: teacher._id,
        action: "COMPLETE_CLASS",
      });

      const avgFeedback =
        feedback.length === 0 ? 0 : feedback.reduce((acc, item) => acc + item.rating, 0) / feedback.length;

      const classCompletionRate =
        totalAssignedClasses === 0 ? 0 : Math.min(uniqueClassesCompleted.length / totalAssignedClasses, 1);

      const score = teacherPerformanceScore({
        totalAttendanceMarked: attendanceMarked,
        totalClassesAssigned: Math.max(totalAssignedClasses, 1),
        classCompletionRate,
        avgFeedback,
      });

      return {
        teacherId: teacher._id,
        name: teacher.name,
        email: teacher.email,
        approved: profile?.approved || false,
        attendanceTracked: attendanceMarked,
        classCompletionRate: Number((classCompletionRate * 100).toFixed(2)),
        feedbackScore: Number(avgFeedback.toFixed(2)),
        performance: score,
      };
    })
  );

  return result.sort((a, b) => b.performance.totalScore - a.performance.totalScore);
}

export async function generateReport(type: "weekly" | "monthly") {
  const now = new Date();
  const rangeStart = type === "weekly" ? startOfWeek(now, { weekStartsOn: 1 }) : startOfMonth(now);
  const rangeEnd = type === "weekly" ? endOfWeek(now, { weekStartsOn: 1 }) : endOfMonth(now);

  const [attendanceCount, marksCount, activityCount] = await Promise.all([
    Attendance.countDocuments({ createdAt: { $gte: rangeStart, $lte: rangeEnd } }),
    Mark.countDocuments({ createdAt: { $gte: rangeStart, $lte: rangeEnd } }),
    ActivityLog.countDocuments({ createdAt: { $gte: rangeStart, $lte: rangeEnd } }),
  ]);

  return {
    type,
    rangeStart,
    rangeEnd,
    kpis: {
      attendanceUpdates: attendanceCount,
      marksUploaded: marksCount,
      teacherActivities: activityCount,
    },
  };
}

export async function principalOverview() {
  const [teachers, approvedTeachers, students, classes, unassignedClasses, pendingApprovals] = await Promise.all([
    User.countDocuments({ role: "teacher" }),
    TeacherProfile.countDocuments({ approved: true }),
    User.countDocuments({ role: "student" }),
    ClassModel.countDocuments({}),
    ClassModel.countDocuments({ teacher: null }),
    TeacherProfile.countDocuments({ approved: false }),
  ]);

  return {
    teachers,
    approvedTeachers,
    students,
    classes,
    unassignedClasses,
    pendingApprovals,
  };
}

export async function activityTrend(days = 7) {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const windows = Array.from({ length: days }, (_, index) => {
    const offset = days - 1 - index;
    const start = new Date(now.getTime() - offset * dayMs);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime());
    end.setHours(23, 59, 59, 999);
    return { start, end };
  });

  const trend = await Promise.all(
    windows.map(async ({ start, end }) => {
      const [activityCount, attendanceCount, marksCount] = await Promise.all([
        ActivityLog.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        Attendance.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        Mark.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      ]);

      return {
        day: start.toLocaleDateString("en-US", { weekday: "short" }),
        activityCount,
        attendanceCount,
        marksCount,
      };
    })
  );

  return trend;
}

export async function listClasses() {
  const classes = await ClassModel.find({})
    .populate("teacher", "name email")
    .sort({ name: 1, section: 1, subject: 1 });

  return classes.map((item) => ({
    _id: item._id,
    name: item.name,
    section: item.section,
    subject: item.subject,
    teacher: item.teacher,
    studentCount: item.students.length,
  }));
}
