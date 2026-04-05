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
import { RefreshToken } from "../models/RefreshToken";
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
    RefreshToken.deleteMany({}),
  ]);

  const password = await bcrypt.hash("Password@123", 10);

  const [principal, ...teachers] = await User.create([
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
      name: "Mia Teacher",
      email: "teacher3@school.com",
      password,
      role: ROLES.TEACHER,
    },
    {
      name: "Leo Teacher",
      email: "teacher4@school.com",
      password,
      role: ROLES.TEACHER,
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

  const students = await User.create(
    studentNames.map((name, index) => ({
      name: `${name} Student`,
      email: `student${index + 1}@school.com`,
      password,
      role: ROLES.STUDENT,
    }))
  );

  const classes = await ClassModel.create([
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

  const classStudentMap = new Map<string, string[]>();
  classes.forEach((cls) => classStudentMap.set(String(cls._id), []));

  students.forEach((student, index) => {
    const classIndex = index % 6;
    const targetClass = classes[classIndex];
    classStudentMap.get(String(targetClass._id))?.push(String(student._id));
  });

  await Promise.all(
    classes.slice(0, 6).map((cls) =>
      ClassModel.findByIdAndUpdate(cls._id, {
        students: classStudentMap.get(String(cls._id)) || [],
      })
    )
  );

  await TeacherProfile.create(
    teachers.map((teacher, index) => {
      const assigned = classes.filter((cls) => String(cls.teacher || "") === String(teacher._id));
      return {
        user: teacher._id,
        employeeId: `T-10${index + 1}`,
        subjects: assigned.map((cls) => cls.subject),
        approved: index !== 2,
        assignedClasses: assigned.map((cls) => cls._id),
      };
    })
  );

  await StudentProfile.create(
    students.map((student, index) => {
      const classIndex = index % 6;
      return {
        user: student._id,
        rollNumber: `S-20${String(index + 1).padStart(2, "0")}`,
        class: classes[classIndex]._id,
        guardianName: `Guardian ${index + 1}`,
      };
    })
  );

  const attendanceRecords: any[] = [];

  const marksRecords: any[] = [];

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

  await Attendance.create(attendanceRecords);
  await Mark.create(marksRecords);

  const feedbackRecords: any[] = students.map((student, index) => {
    const cls = classes[index % 6];
    return {
      teacher: cls.teacher as any,
      student: student._id,
      comment: ["Excellent clarity", "Needs better pacing", "Good class interaction", "Helpful revision support"][
        index % 4
      ],
      rating: (index % 3) + 3,
    };
  });

  await Feedback.create(feedbackRecords);

  const activityRecords: any[] = [];

  for (let dayOffset = 0; dayOffset < 21; dayOffset += 1) {
    const baseDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);

    for (const teacher of teachers) {
      const classForTeacher = classes.find((cls) => String(cls.teacher || "") === String(teacher._id));
      if (!classForTeacher) continue;

      activityRecords.push(
        {
          actor: teacher._id,
          role: ROLES.TEACHER,
          action: "UPLOAD_ATTENDANCE",
          module: "teacher",
          metadata: { classId: classForTeacher._id },
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          actor: teacher._id,
          role: ROLES.TEACHER,
          action: "UPLOAD_MARKS",
          module: "teacher",
          metadata: { classId: classForTeacher._id },
          createdAt: baseDate,
          updatedAt: baseDate,
        },
        {
          actor: teacher._id,
          role: ROLES.TEACHER,
          action: "COMPLETE_CLASS",
          module: "teacher",
          metadata: { classId: classForTeacher._id },
          createdAt: baseDate,
          updatedAt: baseDate,
        }
      );
    }
  }

  await ActivityLog.create(activityRecords);

  await Notification.create([
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

  logger.info("Seed completed. Demo credentials use Password@123");
  process.exit(0);
}

seed().catch((error) => {
  logger.error("Seed failed", error);
  process.exit(1);
});
