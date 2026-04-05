import { Attendance } from "../models/Attendance";
import { ClassModel } from "../models/Class";
import { Mark } from "../models/Mark";
import { StudentProfile } from "../models/StudentProfile";
import { User } from "../models/User";
import { simulateStudentInsights } from "../utils/scoring";

export async function getTeacherClasses(teacherId: string) {
  return ClassModel.find({ teacher: teacherId }).populate("students", "name email").sort({ name: 1 });
}

export async function getClassStudentsWithMetrics(classId: string) {
  const classDoc = await ClassModel.findById(classId).populate("students", "name email role");
  if (!classDoc) return null;

  const students = await Promise.all(
    classDoc.students.map(async (student: any) => {
      const [attendanceRecords, marks] = await Promise.all([
        Attendance.find({ student: student._id, class: classId }).sort({ date: -1 }).limit(40),
        Mark.find({ student: student._id, class: classId }).sort({ createdAt: -1 }).limit(20),
      ]);

      const insight = simulateStudentInsights(attendanceRecords, marks);

      return {
        student,
        attendanceRecords,
        marks,
        insight,
      };
    })
  );

  return {
    class: classDoc,
    students,
  };
}

export async function upsertAttendance(input: {
  student: string;
  classId: string;
  date: Date;
  status: "present" | "absent";
  markedBy: string;
}) {
  return Attendance.findOneAndUpdate(
    { student: input.student, class: input.classId, date: input.date },
    {
      student: input.student,
      class: input.classId,
      date: input.date,
      status: input.status,
      markedBy: input.markedBy,
    },
    { new: true, upsert: true }
  );
}

export async function createMark(input: {
  student: string;
  classId: string;
  subject: string;
  score: number;
  maxScore: number;
  examType: string;
  createdBy: string;
}) {
  return Mark.create({
    student: input.student,
    class: input.classId,
    subject: input.subject,
    score: input.score,
    maxScore: input.maxScore,
    examType: input.examType,
    createdBy: input.createdBy,
  });
}

export async function predictStudent(classId: string, studentId: string) {
  const student = await User.findById(studentId).select("name email role");
  const profile = await StudentProfile.findOne({ user: studentId });

  if (!student || !profile) return null;

  const [attendanceRecords, marks] = await Promise.all([
    Attendance.find({ student: studentId, class: classId }).sort({ date: -1 }).limit(40),
    Mark.find({ student: studentId, class: classId }).sort({ createdAt: -1 }).limit(20),
  ]);

  return {
    student,
    profile,
    insight: simulateStudentInsights(attendanceRecords, marks),
  };
}
