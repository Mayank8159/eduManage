"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeacherClasses = getTeacherClasses;
exports.getClassStudentsWithMetrics = getClassStudentsWithMetrics;
exports.upsertAttendance = upsertAttendance;
exports.createMark = createMark;
exports.predictStudent = predictStudent;
const Attendance_1 = require("../models/Attendance");
const Class_1 = require("../models/Class");
const Mark_1 = require("../models/Mark");
const StudentProfile_1 = require("../models/StudentProfile");
const User_1 = require("../models/User");
const scoring_1 = require("../utils/scoring");
async function getTeacherClasses(teacherId) {
    return Class_1.ClassModel.find({ teacher: teacherId }).populate("students", "name email").sort({ name: 1 });
}
async function getClassStudentsWithMetrics(classId) {
    const classDoc = await Class_1.ClassModel.findById(classId).populate("students", "name email role");
    if (!classDoc)
        return null;
    const students = await Promise.all(classDoc.students.map(async (student) => {
        const [attendanceRecords, marks] = await Promise.all([
            Attendance_1.Attendance.find({ student: student._id, class: classId }).sort({ date: -1 }).limit(40),
            Mark_1.Mark.find({ student: student._id, class: classId }).sort({ createdAt: -1 }).limit(20),
        ]);
        const insight = (0, scoring_1.simulateStudentInsights)(attendanceRecords, marks);
        return {
            student,
            attendanceRecords,
            marks,
            insight,
        };
    }));
    return {
        class: classDoc,
        students,
    };
}
async function upsertAttendance(input) {
    return Attendance_1.Attendance.findOneAndUpdate({ student: input.student, class: input.classId, date: input.date }, {
        student: input.student,
        class: input.classId,
        date: input.date,
        status: input.status,
        markedBy: input.markedBy,
    }, { new: true, upsert: true });
}
async function createMark(input) {
    return Mark_1.Mark.create({
        student: input.student,
        class: input.classId,
        subject: input.subject,
        score: input.score,
        maxScore: input.maxScore,
        examType: input.examType,
        createdBy: input.createdBy,
    });
}
async function predictStudent(classId, studentId) {
    const student = await User_1.User.findById(studentId).select("name email role");
    const profile = await StudentProfile_1.StudentProfile.findOne({ user: studentId });
    if (!student || !profile)
        return null;
    const [attendanceRecords, marks] = await Promise.all([
        Attendance_1.Attendance.find({ student: studentId, class: classId }).sort({ date: -1 }).limit(40),
        Mark_1.Mark.find({ student: studentId, class: classId }).sort({ createdAt: -1 }).limit(20),
    ]);
    return {
        student,
        profile,
        insight: (0, scoring_1.simulateStudentInsights)(attendanceRecords, marks),
    };
}
