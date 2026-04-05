"use client";

import { ProtectedRoute } from "@/components/protected-route";
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-cyan-50 to-emerald-50 p-4 md:p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row">
          <Sidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
