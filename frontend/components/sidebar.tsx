"use client";

import { Bell, BookOpen, ChartNoAxesCombined, ClipboardCheck, LayoutDashboard, LogOut } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const linksByRole: Record<string, Array<{ label: string; key: string }>> = {
  principal: [
    { label: "Dashboard", key: "dashboard" },
    { label: "Teachers", key: "teachers" },
    { label: "Students", key: "students" },
    { label: "Reports", key: "reports" },
    { label: "Activity Logs", key: "activity-logs" },
  ],
  teacher: [
    { label: "Dashboard", key: "dashboard" },
    { label: "Classes", key: "classes" },
    { label: "Attendance", key: "attendance" },
    { label: "Marks", key: "marks" },
    { label: "Predictions", key: "predictions" },
  ],
  student: [
    { label: "Dashboard", key: "dashboard" },
    { label: "My Reports", key: "my-reports" },
    { label: "Attendance", key: "attendance" },
    { label: "Feedback", key: "feedback" },
  ],
};

export function Sidebar() {
  const { session, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeSection = searchParams.get("section") || "dashboard";

  if (!session) return null;

  return (
    <aside className="w-full rounded-2xl bg-slate-900 p-4 text-slate-100 md:w-72">
      <div className="mb-6 flex items-center gap-3 border-b border-slate-700 pb-4">
        <div className="rounded-xl bg-cyan-400/20 p-2 text-cyan-300">
          <LayoutDashboard size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold">EduManage</p>
          <p className="text-xs text-slate-400">School Management</p>
        </div>
      </div>

      <div className="mb-5 rounded-xl bg-slate-800 p-3">
        <p className="text-sm font-semibold">{session.user.name}</p>
        <p className="text-xs text-slate-400">{session.user.email}</p>
        <p className="mt-1 inline-block rounded-full bg-cyan-400/20 px-2 py-1 text-[11px] uppercase tracking-wide text-cyan-300">
          {session.user.role}
        </p>
      </div>

      <ul className="space-y-2">
        {linksByRole[session.user.role].map((link) => (
          <li
            key={link.key}
            onClick={() => router.push(`/dashboard?section=${link.key}`)}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm transition ${
              activeSection === link.key
                ? "bg-cyan-400/20 font-semibold text-cyan-200"
                : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            {link.label === "Reports" || link.label === "My Reports" ? <ChartNoAxesCombined size={16} /> : null}
            {link.label === "Classes" ? <BookOpen size={16} /> : null}
            {link.label === "Attendance" ? <ClipboardCheck size={16} /> : null}
            {link.label === "Dashboard" ? <LayoutDashboard size={16} /> : null}
            {link.label === "Activity Logs" ? <Bell size={16} /> : null}
            {![
              "Reports",
              "My Reports",
              "Classes",
              "Attendance",
              "Dashboard",
              "Activity Logs",
            ].includes(link.label)
              ? "•"
              : null}
            <span>{link.label}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={logout}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
      >
        <LogOut size={16} /> Logout
      </button>
    </aside>
  );
}
