"use client";

import { Bell, BookOpen, ChartNoAxesCombined, ClipboardCheck, LayoutDashboard, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const linksByRole = {
  principal: ["Dashboard", "Teachers", "Students", "Reports", "Activity Logs"],
  teacher: ["Dashboard", "Classes", "Attendance", "Marks", "Predictions"],
  student: ["Dashboard", "My Reports", "Attendance", "Feedback"],
};

export function Sidebar() {
  const { session, logout } = useAuth();

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
        {linksByRole[session.user.role].map((label) => (
          <li key={label} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-slate-800">
            {label === "Reports" || label === "My Reports" ? <ChartNoAxesCombined size={16} /> : null}
            {label === "Classes" ? <BookOpen size={16} /> : null}
            {label === "Attendance" ? <ClipboardCheck size={16} /> : null}
            {label === "Dashboard" ? <LayoutDashboard size={16} /> : null}
            {label === "Activity Logs" ? <Bell size={16} /> : null}
            {![
              "Reports",
              "My Reports",
              "Classes",
              "Attendance",
              "Dashboard",
              "Activity Logs",
            ].includes(label)
              ? "•"
              : null}
            <span>{label}</span>
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
