"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.teacherAnalytics = teacherAnalytics;
exports.generateReport = generateReport;
const date_fns_1 = require("date-fns");
const ActivityLog_1 = require("../models/ActivityLog");
const Attendance_1 = require("../models/Attendance");
const Feedback_1 = require("../models/Feedback");
const Mark_1 = require("../models/Mark");
const TeacherProfile_1 = require("../models/TeacherProfile");
const User_1 = require("../models/User");
const pagination_1 = require("../utils/pagination");
const scoring_1 = require("../utils/scoring");
async function listUsers(role, search, pageRaw, limitRaw) {
    const { page, limit, skip } = (0, pagination_1.getPagination)(pageRaw, limitRaw);
    const query = {};
    if (role)
        query.role = role;
    if (search)
        query.$or = [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }];
    const [items, total] = await Promise.all([
        User_1.User.find(query).select("name email role isActive createdAt").skip(skip).limit(limit).sort({ createdAt: -1 }),
        User_1.User.countDocuments(query),
    ]);
    return { items, pagination: { page, limit, total } };
}
async function teacherAnalytics() {
    const teachers = await User_1.User.find({ role: "teacher" }).select("name email");
    const result = await Promise.all(teachers.map(async (teacher) => {
        const profile = await TeacherProfile_1.TeacherProfile.findOne({ user: teacher._id });
        const totalAssignedClasses = profile?.assignedClasses.length || 0;
        const attendanceMarked = await Attendance_1.Attendance.countDocuments({ markedBy: teacher._id });
        const feedback = await Feedback_1.Feedback.find({ teacher: teacher._id });
        const uniqueClassesCompleted = await ActivityLog_1.ActivityLog.distinct("metadata.classId", {
            actor: teacher._id,
            action: "COMPLETE_CLASS",
        });
        const avgFeedback = feedback.length === 0 ? 0 : feedback.reduce((acc, item) => acc + item.rating, 0) / feedback.length;
        const classCompletionRate = totalAssignedClasses === 0 ? 0 : Math.min(uniqueClassesCompleted.length / totalAssignedClasses, 1);
        const score = (0, scoring_1.teacherPerformanceScore)({
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
    }));
    return result.sort((a, b) => b.performance.totalScore - a.performance.totalScore);
}
async function generateReport(type) {
    const now = new Date();
    const rangeStart = type === "weekly" ? (0, date_fns_1.startOfWeek)(now, { weekStartsOn: 1 }) : (0, date_fns_1.startOfMonth)(now);
    const rangeEnd = type === "weekly" ? (0, date_fns_1.endOfWeek)(now, { weekStartsOn: 1 }) : (0, date_fns_1.endOfMonth)(now);
    const [attendanceCount, marksCount, activityCount] = await Promise.all([
        Attendance_1.Attendance.countDocuments({ createdAt: { $gte: rangeStart, $lte: rangeEnd } }),
        Mark_1.Mark.countDocuments({ createdAt: { $gte: rangeStart, $lte: rangeEnd } }),
        ActivityLog_1.ActivityLog.countDocuments({ createdAt: { $gte: rangeStart, $lte: rangeEnd } }),
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
