"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentDashboard = getStudentDashboard;
const Attendance_1 = require("../models/Attendance");
const Feedback_1 = require("../models/Feedback");
const Mark_1 = require("../models/Mark");
const StudentProfile_1 = require("../models/StudentProfile");
const scoring_1 = require("../utils/scoring");
async function getStudentDashboard(userId) {
    const profile = await StudentProfile_1.StudentProfile.findOne({ user: userId }).populate("class");
    if (!profile)
        return null;
    const [attendanceRecords, marks, feedback] = await Promise.all([
        Attendance_1.Attendance.find({ student: userId, class: profile.class }).sort({ date: -1 }).limit(50),
        Mark_1.Mark.find({ student: userId, class: profile.class }).sort({ createdAt: -1 }).limit(50),
        Feedback_1.Feedback.find({ student: userId }).populate("teacher", "name email"),
    ]);
    const insight = (0, scoring_1.simulateStudentInsights)(attendanceRecords, marks);
    return {
        profile,
        attendanceRecords,
        marks,
        feedback,
        insight,
    };
}
