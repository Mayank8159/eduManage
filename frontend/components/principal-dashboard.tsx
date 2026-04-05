"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface TeacherAnalytics {
  teacherId: string;
  name: string;
  attendanceTracked: number;
  classCompletionRate: number;
  feedbackScore: number;
  performance: { totalScore: number };
}

export function PrincipalDashboard() {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<TeacherAnalytics[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [reportType, setReportType] = useState<"weekly" | "monthly">("weekly");
  const [report, setReport] = useState<any>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    void Promise.allSettled([
      api.get("/principal/teacher-analytics", { headers }),
      api.get("/principal/activity-logs?page=1&limit=8", { headers }),
      api.get("/principal/users?role=teacher&page=1&limit=20", { headers }),
      api.get(`/principal/reports?type=${reportType}`, { headers }),
    ]).then((results) => {
      const [analyticsRes, logsRes, teachersRes, reportRes] = results;

      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value.data || []);
      }

      if (logsRes.status === "fulfilled") {
        setLogs(logsRes.value.data.items || []);
      }

      if (teachersRes.status === "fulfilled") {
        setTeachers(teachersRes.value.data.items || []);
      }

      if (reportRes.status === "fulfilled") {
        setReport(reportRes.value.data || null);
      }
    });
  }, [token, reportType]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) =>
      `${teacher.name} ${teacher.email}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [teachers, search]);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">Principal Command Center</h2>
        <p className="text-sm text-slate-500">Monitor teaching quality, class progress, and activity logs.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard title="Teachers" value={String(teachers.length)} />
        <StatCard title="Tracked Activities" value={String(logs.length)} />
        <StatCard title="Report Type" value={reportType} />
        <StatCard title="Top Score" value={String(analytics[0]?.performance.totalScore || 0)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Teacher Performance Analytics</h3>
            <select
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
              value={reportType}
              onChange={(event) => setReportType(event.target.value as "weekly" | "monthly")}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="h-80 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendanceTracked" fill="#0f766e" />
                <Bar dataKey="classCompletionRate" fill="#1d4ed8" />
                <Bar dataKey="feedbackScore" fill="#ca8a04" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">Generated Report</h3>
          <div className="space-y-2 text-sm">
            <p>Attendance Updates: {report?.kpis?.attendanceUpdates || 0}</p>
            <p>Marks Uploaded: {report?.kpis?.marksUploaded || 0}</p>
            <p>Teacher Activities: {report?.kpis?.teacherActivities || 0}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Teacher Directory</h3>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search teacher..."
            className="rounded-lg border border-slate-200 px-3 py-1 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="py-2">Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.map((teacher) => (
                <tr key={teacher._id} className="border-b border-slate-100">
                  <td className="py-2">{teacher.name}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.role}</td>
                  <td>{teacher.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">Recent Teacher Activity Logs</h3>
        <div className="space-y-2 text-sm text-slate-600">
          {logs.map((log) => (
            <div key={log._id} className="rounded-lg border border-slate-100 p-2">
              <p className="font-medium text-slate-800">{log.action}</p>
              <p>
                {log.actor?.name} • {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}
