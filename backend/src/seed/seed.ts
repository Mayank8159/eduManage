import bcrypt from "bcryptjs";
import { connectDB } from "../config/db";
import { logger } from "../utils/logger";
import { User } from "../models/User";
import { TeacherProfile } from "../models/TeacherProfile";
import { StudentProfile } from "../models/StudentProfile";
import { ClassModel } from "../models/Class";
import { Attendance } from "../models/Attendance";
import { Mark } from "../models/Mark";
import { Feedback } from "../models/Feedback";
import { ActivityLog } from "../models/ActivityLog";
import { Notification } from "../models/Notification";
import { ROLES } from "../constants/roles";

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    TeacherProfile.deleteMany({}),
    StudentProfile.deleteMany({}),
    ClassModel.deleteMany({}),
    Attendance.deleteMany({}),
    Mark.deleteMany({}),
    Feedback.deleteMany({}),
    ActivityLog.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  const password = await bcrypt.hash("Password@123", 10);

  const [principal, teacher1, teacher2, student1, student2, student3] = await User.create([
    {
      name: "Principal Admin",
      email: "principal@school.com",
      password,
      role: ROLES.PRINCIPAL,
    },
    {
      name: "Ava Teacher",
      email: "teacher1@school.com",
      password,
      role: ROLES.TEACHER,
    },
    {
      name: "Noah Teacher",
      email: "teacher2@school.com",
      password,
      role: ROLES.TEACHER,
    },
    {
      name: "Liam Student",
      email: "student1@school.com",
      password,
      role: ROLES.STUDENT,
    },
    {
      name: "Emma Student",
      email: "student2@school.com",
      password,
      role: ROLES.STUDENT,
    },
    {
      name: "Olivia Student",
      email: "student3@school.com",
      password,
      role: ROLES.STUDENT,
    },
  ]);

  const classA = await ClassModel.create({
    name: "Class 10",
    section: "A",
    subject: "Mathematics",
    teacher: teacher1._id,
    students: [student1._id, student2._id],
  });

  const classB = await ClassModel.create({
    name: "Class 10",
    section: "B",
    subject: "Science",
    teacher: teacher2._id,
    students: [student3._id],
  });

  await TeacherProfile.create([
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

  await StudentProfile.create([
    { user: student1._id, rollNumber: "S-2001", class: classA._id, guardianName: "John" },
    { user: student2._id, rollNumber: "S-2002", class: classA._id, guardianName: "Sophia" },
    { user: student3._id, rollNumber: "S-2003", class: classB._id, guardianName: "Mason" },
  ]);

  const today = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await Attendance.create([
    { student: student1._id, class: classA._id, date: today, status: "present", markedBy: teacher1._id },
    { student: student2._id, class: classA._id, date: today, status: "absent", markedBy: teacher1._id },
    { student: student3._id, class: classB._id, date: today, status: "present", markedBy: teacher2._id },
    { student: student1._id, class: classA._id, date: yesterday, status: "present", markedBy: teacher1._id },
    { student: student2._id, class: classA._id, date: yesterday, status: "present", markedBy: teacher1._id },
  ]);

  await Mark.create([
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

  await Feedback.create([
    { teacher: teacher1._id, student: student1._id, comment: "Good clarity in class", rating: 4 },
    { teacher: teacher1._id, student: student2._id, comment: "Needs more examples", rating: 3 },
    { teacher: teacher2._id, student: student3._id, comment: "Excellent teaching", rating: 5 },
  ]);

  await ActivityLog.create([
    {
      actor: teacher1._id,
      role: ROLES.TEACHER,
      action: "UPLOAD_MARKS",
      module: "teacher",
      metadata: { classId: classA._id },
    },
    {
      actor: teacher1._id,
      role: ROLES.TEACHER,
      action: "COMPLETE_CLASS",
      module: "teacher",
      metadata: { classId: classA._id },
    },
    {
      actor: teacher2._id,
      role: ROLES.TEACHER,
      action: "UPLOAD_ATTENDANCE",
      module: "teacher",
      metadata: { classId: classB._id },
    },
  ]);

  await Notification.create([
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

  logger.info("Seed completed. Demo credentials use Password@123");
  process.exit(0);
}

seed().catch((error) => {
  logger.error("Seed failed", error);
  process.exit(1);
});
