"use client";

import { PrincipalDashboard } from "@/components/principal-dashboard";
import { StudentDashboard } from "@/components/student-dashboard";
import { TeacherDashboard } from "@/components/teacher-dashboard";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { session } = useAuth();

  if (!session) return null;

  if (session.user.role === "principal") {
    return <PrincipalDashboard />;
  }

  if (session.user.role === "teacher") {
    return <TeacherDashboard />;
  }

  return <StudentDashboard />;
}
