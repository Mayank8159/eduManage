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
const RefreshToken_1 = require("../models/RefreshToken");
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
        RefreshToken_1.RefreshToken.deleteMany({}),
    ]);
    const password = await bcryptjs_1.default.hash("Password@123", 10);
    const [principal, ...teachers] = await User_1.User.create([
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
            name: "Mia Teacher",
            email: "teacher3@school.com",
            password,
            role: roles_1.ROLES.TEACHER,
        },
        {
            name: "Leo Teacher",
            email: "teacher4@school.com",
            password,
            role: roles_1.ROLES.TEACHER,
        },
    ]);
    const studentNames = [
        "Liam",
        "Emma",
        "Olivia",
        "Noah",
        "Ava",
        "Elijah",
        "Sophia",
        "Lucas",
        "Amelia",
        "Ethan",
        "Mason",
        "Isabella",
        "James",
        "Mia",
        "Benjamin",
        "Charlotte",
        "Henry",
        "Harper",
        "Alexander",
        "Evelyn",
        "Michael",
        "Abigail",
        "Daniel",
        "Ella",
    ];
    const students = await User_1.User.create(studentNames.map((name, index) => ({
        name: `${name} Student`,
        email: `student${index + 1}@school.com`,
        password,
        role: roles_1.ROLES.STUDENT,
    })));
    const classes = await Class_1.ClassModel.create([
        {
            name: "Class 8",
            section: "A",
            subject: "Mathematics",
            teacher: teachers[0]._id,
        },
        {
            name: "Class 8",
            section: "B",
            subject: "Science",
            teacher: teachers[1]._id,
        },
        {
            name: "Class 9",
            section: "A",
            subject: "English",
            teacher: teachers[2]._id,
        },
        {
            name: "Class 9",
            section: "B",
            subject: "Social Studies",
            teacher: teachers[3]._id,
        },
        {
            name: "Class 10",
            section: "A",
            subject: "Mathematics",
            teacher: teachers[0]._id,
        },
        {
            name: "Class 10",
            section: "B",
            subject: "Science",
            teacher: teachers[1]._id,
        },
        {
            name: "Class 11",
            section: "A",
            subject: "Computer Science",
            teacher: null,
        },
        {
            name: "Class 12",
            section: "A",
            subject: "Economics",
            teacher: null,
        },
    ]);
    const classStudentMap = new Map();
    classes.forEach((cls) => classStudentMap.set(String(cls._id), []));
    students.forEach((student, index) => {
        const classIndex = index % 6;
        const targetClass = classes[classIndex];
        classStudentMap.get(String(targetClass._id))?.push(String(student._id));
    });
    await Promise.all(classes.slice(0, 6).map((cls) => Class_1.ClassModel.findByIdAndUpdate(cls._id, {
        students: classStudentMap.get(String(cls._id)) || [],
    })));
    await TeacherProfile_1.TeacherProfile.create(teachers.map((teacher, index) => {
        const assigned = classes.filter((cls) => String(cls.teacher || "") === String(teacher._id));
        return {
            user: teacher._id,
            employeeId: `T-10${index + 1}`,
            subjects: assigned.map((cls) => cls.subject),
            approved: index !== 2,
            assignedClasses: assigned.map((cls) => cls._id),
        };
    }));
    await StudentProfile_1.StudentProfile.create(students.map((student, index) => {
        const classIndex = index % 6;
        return {
            user: student._id,
            rollNumber: `S-20${String(index + 1).padStart(2, "0")}`,
            class: classes[classIndex]._id,
            guardianName: `Guardian ${index + 1}`,
        };
    }));
    const attendanceRecords = [];
    const marksRecords = [];
    for (let dayOffset = 0; dayOffset < 30; dayOffset += 1) {
        const date = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
        for (const cls of classes.slice(0, 6)) {
            const studentIds = classStudentMap.get(String(cls._id)) || [];
            for (const studentId of studentIds) {
                const present = Math.random() > 0.12;
                attendanceRecords.push({
                    student: studentId,
                    class: cls._id,
                    date,
                    status: present ? "present" : "absent",
                    markedBy: cls.teacher,
                });
                if (dayOffset % 7 === 0) {
                    marksRecords.push({
                        student: studentId,
                        class: cls._id,
                        subject: cls.subject,
                        score: Math.floor(Math.random() * 45) + 50,
                        maxScore: 100,
                        examType: "Weekly Test",
                        createdBy: cls.teacher,
                    });
                }
            }
        }
    }
    await Attendance_1.Attendance.create(attendanceRecords);
    await Mark_1.Mark.create(marksRecords);
    const feedbackRecords = students.map((student, index) => {
        const cls = classes[index % 6];
        return {
            teacher: cls.teacher,
            student: student._id,
            comment: ["Excellent clarity", "Needs better pacing", "Good class interaction", "Helpful revision support"][index % 4],
            rating: (index % 3) + 3,
        };
    });
    await Feedback_1.Feedback.create(feedbackRecords);
    const activityRecords = [];
    for (let dayOffset = 0; dayOffset < 21; dayOffset += 1) {
        const baseDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
        for (const teacher of teachers) {
            const classForTeacher = classes.find((cls) => String(cls.teacher || "") === String(teacher._id));
            if (!classForTeacher)
                continue;
            activityRecords.push({
                actor: teacher._id,
                role: roles_1.ROLES.TEACHER,
                action: "UPLOAD_ATTENDANCE",
                module: "teacher",
                metadata: { classId: classForTeacher._id },
                createdAt: baseDate,
                updatedAt: baseDate,
            }, {
                actor: teacher._id,
                role: roles_1.ROLES.TEACHER,
                action: "UPLOAD_MARKS",
                module: "teacher",
                metadata: { classId: classForTeacher._id },
                createdAt: baseDate,
                updatedAt: baseDate,
            }, {
                actor: teacher._id,
                role: roles_1.ROLES.TEACHER,
                action: "COMPLETE_CLASS",
                module: "teacher",
                metadata: { classId: classForTeacher._id },
                createdAt: baseDate,
                updatedAt: baseDate,
            });
        }
    }
    await ActivityLog_1.ActivityLog.create(activityRecords);
    await Notification_1.Notification.create([
        {
            toUser: teachers[0]._id,
            title: "Monthly Review",
            message: "Please submit monthly class report.",
            type: "info",
            createdBy: principal._id,
        },
        {
            toUser: students[4]._id,
            title: "Performance Alert",
            message: "Your attendance dropped this week. Connect with class teacher.",
            type: "warning",
            createdBy: teachers[0]._id,
        },
    ]);
    logger_1.logger.info("Seed completed. Demo credentials use Password@123");
    process.exit(0);
}
seed().catch((error) => {
    logger_1.logger.error("Seed failed", error);
    process.exit(1);
});
