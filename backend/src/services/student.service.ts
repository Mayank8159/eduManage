import { Attendance } from "../models/Attendance";
import { Feedback } from "../models/Feedback";
import { Mark } from "../models/Mark";
import { StudentProfile } from "../models/StudentProfile";
import { simulateStudentInsights } from "../utils/scoring";

export async function getStudentDashboard(userId: string) {
  const profile = await StudentProfile.findOne({ user: userId }).populate("class");
  if (!profile) return null;

  const [attendanceRecords, marks, feedback] = await Promise.all([
    Attendance.find({ student: userId, class: profile.class }).sort({ date: -1 }).limit(50),
    Mark.find({ student: userId, class: profile.class }).sort({ createdAt: -1 }).limit(50),
    Feedback.find({ student: userId }).populate("teacher", "name email"),
  ]);

  const insight = simulateStudentInsights(attendanceRecords, marks);

  return {
    profile,
    attendanceRecords,
    marks,
    feedback,
    insight,
  };
}
