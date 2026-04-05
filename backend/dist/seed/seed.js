"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const logger_1 = require("../utils/logger");
const User_1 = require("../models/User");
const TeacherProfile_1 = require("../models/TeacherProfile");
const StudentProfile_1 = require("../models/StudentProfile");
const Class_1 = require("../models/Class");
const Attendance_1 = require("../models/Attendance");
const Mark_1 = require("../models/Mark");
const Feedback_1 = require("../models/Feedback");
const ActivityLog_1 = require("../models/ActivityLog");
const Notification_1 = require("../models/Notification");
const roles_1 = require("../constants/roles");
async function seed() {
    await (0, db_1.connectDB)();
    await Promise.all([
        User_1.User.deleteMany({}),
        TeacherProfile_1.TeacherProfile.deleteMany({}),
        StudentProfile_1.StudentProfile.deleteMany({}),
        Class_1.ClassModel.deleteMany({}),
        Attendance_1.Attendance.deleteMany({}),
        Mark_1.Mark.deleteMany({}),
        Feedback_1.Feedback.deleteMany({}),
        ActivityLog_1.ActivityLog.deleteMany({}),
        Notification_1.Notification.deleteMany({}),
    ]);
    const password = await bcryptjs_1.default.hash("Password@123", 10);
    const [principal, teacher1, teacher2, student1, student2, student3] = await User_1.User.create([
        {
            name: "Principal Admin",
            email: "principal@school.com",
            password,
            role: roles_1.ROLES.PRINCIPAL,
        },
        {
            name: "Ava Teacher",
            email: "teacher1@school.com",
            password,
            role: roles_1.ROLES.TEACHER,
        },
        {
            name: "Noah Teacher",
            email: "teacher2@school.com",
            password,
            role: roles_1.ROLES.TEACHER,
        },
        {
            name: "Liam Student",
            email: "student1@school.com",
            password,
            role: roles_1.ROLES.STUDENT,
        },
        {
            name: "Emma Student",
            email: "student2@school.com",
            password,
            role: roles_1.ROLES.STUDENT,
        },
        {
            name: "Olivia Student",
            email: "student3@school.com",
            password,
            role: roles_1.ROLES.STUDENT,
        },
    ]);
    const classA = await Class_1.ClassModel.create({
        name: "Class 10",
        section: "A",
        subject: "Mathematics",
        teacher: teacher1._id,
        students: [student1._id, student2._id],
    });
    const classB = await Class_1.ClassModel.create({
        name: "Class 10",
        section: "B",
        subject: "Science",
        teacher: teacher2._id,
        students: [student3._id],
    });
    await TeacherProfile_1.TeacherProfile.create([
        {
            user: teacher1._id,
            employeeId: "T-1001",
            subjects: ["Mathematics"],
            approved: true,
            assignedClasses: [classA._id],
        },
        {
            user: teacher2._id,
            employeeId: "T-1002",
            subjects: ["Science"],
            approved: true,
            assignedClasses: [classB._id],
        },
    ]);
    await StudentProfile_1.StudentProfile.create([
        { user: student1._id, rollNumber: "S-2001", class: classA._id, guardianName: "John" },
        { user: student2._id, rollNumber: "S-2002", class: classA._id, guardianName: "Sophia" },
        { user: student3._id, rollNumber: "S-2003", class: classB._id, guardianName: "Mason" },
    ]);
    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await Attendance_1.Attendance.create([
        { student: student1._id, class: classA._id, date: today, status: "present", markedBy: teacher1._id },
        { student: student2._id, class: classA._id, date: today, status: "absent", markedBy: teacher1._id },
        { student: student3._id, class: classB._id, date: today, status: "present", markedBy: teacher2._id },
        { student: student1._id, class: classA._id, date: yesterday, status: "present", markedBy: teacher1._id },
        { student: student2._id, class: classA._id, date: yesterday, status: "present", markedBy: teacher1._id },
    ]);
    await Mark_1.Mark.create([
        {
            student: student1._id,
            class: classA._id,
            subject: "Mathematics",
            score: 78,
            maxScore: 100,
            examType: "Weekly Test",
            createdBy: teacher1._id,
        },
        {
            student: student2._id,
            class: classA._id,
            subject: "Mathematics",
            score: 52,
            maxScore: 100,
            examType: "Weekly Test",
            createdBy: teacher1._id,
        },
        {
            student: student3._id,
            class: classB._id,
            subject: "Science",
            score: 91,
            maxScore: 100,
            examType: "Weekly Test",
            createdBy: teacher2._id,
        },
    ]);
    await Feedback_1.Feedback.create([
        { teacher: teacher1._id, student: student1._id, comment: "Good clarity in class", rating: 4 },
        { teacher: teacher1._id, student: student2._id, comment: "Needs more examples", rating: 3 },
        { teacher: teacher2._id, student: student3._id, comment: "Excellent teaching", rating: 5 },
    ]);
    await ActivityLog_1.ActivityLog.create([
        {
            actor: teacher1._id,
            role: roles_1.ROLES.TEACHER,
            action: "UPLOAD_MARKS",
            module: "teacher",
            metadata: { classId: classA._id },
        },
        {
            actor: teacher1._id,
            role: roles_1.ROLES.TEACHER,
            action: "COMPLETE_CLASS",
            module: "teacher",
            metadata: { classId: classA._id },
        },
        {
            actor: teacher2._id,
            role: roles_1.ROLES.TEACHER,
            action: "UPLOAD_ATTENDANCE",
            module: "teacher",
            metadata: { classId: classB._id },
        },
    ]);
    await Notification_1.Notification.create([
        {
            toUser: teacher1._id,
            title: "Monthly Review",
            message: "Please submit monthly class report.",
            type: "info",
            createdBy: principal._id,
        },
        {
            toUser: student2._id,
            title: "Performance Alert",
            message: "Your attendance dropped this week. Connect with class teacher.",
            type: "warning",
            createdBy: teacher1._id,
        },
    ]);
    logger_1.logger.info("Seed completed. Demo credentials use Password@123");
    process.exit(0);
}
seed().catch((error) => {
    logger_1.logger.error("Seed failed", error);
    process.exit(1);
});
