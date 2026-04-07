"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface TeacherAnalytics {
  teacherId: string;
  name: string;
  email: string;
  approved: boolean;
  attendanceTracked: number;
  classCompletionRate: number;
  feedbackScore: number;
  performance: { totalScore: number };
}

interface ClassItem {
  _id: string;
  name: string;
  section: string;
  subject: string;
  teacher: { _id: string; name: string } | null;
  studentCount: number;
}

export function PrincipalDashboard() {
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const [chartsReady, setChartsReady] = useState(false);
  const [analytics, setAnalytics] = useState<TeacherAnalytics[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [reportType, setReportType] = useState<"weekly" | "monthly">("weekly");
  const [report, setReport] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [teacherPage, setTeacherPage] = useState(1);
  const [teacherTotal, setTeacherTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logTotal, setLogTotal] = useState(0);
  const [assignMap, setAssignMap] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string>("");
  const [message, setMessage] = useState("");
  const activeSection = searchParams.get("section") || "dashboard";

  const teacherLimit = 8;
  const logLimit = 8;

  useEffect(() => {
    setChartsReady(true);
  }, []);

  const loadDashboardData = async () => {
    if (!token) return;

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const [analyticsRes, logsRes, teachersRes, studentsRes, reportRes, trendRes, classesRes, overviewRes] =
        await Promise.all([
          api.get("/principal/teacher-analytics", config),
          api.get(`/principal/activity-logs?page=${logPage}&limit=${logLimit}`, config),
          api.get(`/principal/users?role=teacher&page=${teacherPage}&limit=${teacherLimit}&search=${search}`, config),
          api.get("/principal/users?role=student&page=1&limit=50", config),
          api.get(`/principal/reports?type=${reportType}`, config),
          api.get("/principal/activity-trend?days=7", config),
          api.get("/principal/classes", config),
          api.get("/principal/overview", config),
        ]);

      setAnalytics(analyticsRes.data || []);
      setLogs(logsRes.data.items || []);
      setLogTotal(logsRes.data.pagination?.total || 0);
      setTeachers(teachersRes.data.items || []);
      setTeacherTotal(teachersRes.data.pagination?.total || 0);
      setStudents(studentsRes.data.items || []);
      setReport(reportRes.data || null);
      setTrend(trendRes.data || []);
      setClasses(classesRes.data || []);
      setOverview(overviewRes.data || null);
    } catch {
      setMessage("Session expired. Please login again.");
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, [token, reportType, search, teacherPage, logPage]);

  const classOptionsByTeacher = useMemo(() => {
    const map: Record<string, ClassItem[]> = {};
    for (const teacher of analytics) {
      map[teacher.teacherId] = classes.filter((cls) => !cls.teacher || cls.teacher._id === teacher.teacherId);
    }
    return map;
  }, [analytics, classes]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher) =>
      `${teacher.name} ${teacher.email}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [teachers, search]);

  const updateApproval = async (teacherId: string, approved: boolean) => {
    if (!token) return;

    setActionLoading(`approve-${teacherId}`);
    setMessage("");

    try {
      await api.patch(
        `/principal/teachers/${teacherId}/approve`,
        { approved },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Teacher ${approved ? "approved" : "set to pending"} successfully.`);
      await loadDashboardData();
    } catch {
      setMessage("Failed to update teacher approval.");
    } finally {
      setActionLoading("");
    }
  };

  const assignClass = async (teacherId: string) => {
    if (!token) return;

    const classId = assignMap[teacherId];
    if (!classId) {
      setMessage("Please select a class before assigning.");
      return;
    }

    setActionLoading(`assign-${teacherId}`);
    setMessage("");

    try {
      await api.post(
        `/principal/teachers/${teacherId}/assign-class`,
        { classId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Class assigned successfully.");
      setAssignMap((previous) => ({ ...previous, [teacherId]: "" }));
      await loadDashboardData();
    } catch {
      setMessage("Failed to assign class.");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">Principal Command Center</h2>
        <p className="text-sm text-slate-500">Monitor teaching quality, class assignments, activity trends, and approvals.</p>
        {message ? <p className="mt-2 text-sm font-medium text-cyan-700">{message}</p> : null}
      </header>

      {(activeSection === "dashboard" || activeSection === "reports") ? (
      <section className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard title="Teachers" value={String(overview?.teachers || 0)} />
        <StatCard title="Approved" value={String(overview?.approvedTeachers || 0)} />
        <StatCard title="Pending" value={String(overview?.pendingApprovals || 0)} />
        <StatCard title="Students" value={String(overview?.students || students.length)} />
        <StatCard title="Classes" value={String(overview?.classes || classes.length)} />
        <StatCard title="Unassigned" value={String(overview?.unassignedClasses || 0)} />
      </section>
      ) : null}

      {(activeSection === "dashboard" || activeSection === "teachers" || activeSection === "reports") ? (
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
            {chartsReady ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={240}>
              <BarChart data={analytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="performance.totalScore" fill="#0f766e" name="Performance Score" />
                <Bar dataKey="classCompletionRate" fill="#1d4ed8" />
                <Bar dataKey="feedbackScore" fill="#ca8a04" />
              </BarChart>
            </ResponsiveContainer>
            ) : <div className="h-full min-h-[240px] w-full" />}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">Generated Report</h3>
          <div className="space-y-2 text-sm">
            <p>Attendance Updates: {report?.kpis?.attendanceUpdates || 0}</p>
            <p>Marks Uploaded: {report?.kpis?.marksUploaded || 0}</p>
            <p>Teacher Activities: {report?.kpis?.teacherActivities || 0}</p>
            <p>Top Score: {analytics[0]?.performance.totalScore || 0}</p>
          </div>
        </div>
      </section>
      ) : null}

      {(activeSection === "dashboard" || activeSection === "reports") ? (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">Weekly Activity Trend</h3>
        <div className="h-72 min-w-0">
          {chartsReady ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="activityCount" stroke="#0f766e" strokeWidth={2} />
              <Line type="monotone" dataKey="attendanceCount" stroke="#1d4ed8" strokeWidth={2} />
              <Line type="monotone" dataKey="marksCount" stroke="#ca8a04" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          ) : <div className="h-full min-h-[220px] w-full" />}
        </div>
      </section>
      ) : null}

      {(activeSection === "dashboard" || activeSection === "teachers") ? (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Teacher Control Panel</h3>
          <input
            value={search}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                setTeacherPage(1);
              }
            }}
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
                <th>Approval</th>
                <th>Assign Class</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {analytics
                .filter((teacher) =>
                  `${teacher.name} ${teacher.email}`.toLowerCase().includes(search.toLowerCase())
                )
                .map((teacher) => (
                <tr key={teacher.teacherId} className="border-b border-slate-100">
                  <td className="py-2">{teacher.name}</td>
                  <td>{teacher.email}</td>
                  <td>
                    <button
                      onClick={() => updateApproval(teacher.teacherId, !teacher.approved)}
                      disabled={actionLoading === `approve-${teacher.teacherId}`}
                      className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                        teacher.approved
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {teacher.approved ? "Approved" : "Pending"}
                    </button>
                  </td>
                  <td>
                    <select
                      value={assignMap[teacher.teacherId] || ""}
                      onChange={(event) =>
                        setAssignMap((previous) => ({
                          ...previous,
                          [teacher.teacherId]: event.target.value,
                        }))
                      }
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    >
                      <option value="">Select class</option>
                      {(classOptionsByTeacher[teacher.teacherId] || []).map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name} {cls.section} - {cls.subject}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button
                      onClick={() => assignClass(teacher.teacherId)}
                      disabled={actionLoading === `assign-${teacher.teacherId}`}
                      className="rounded-lg bg-cyan-600 px-2 py-1 text-xs font-semibold text-white"
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <p>Showing {filteredTeachers.length} teachers (paged total: {teacherTotal})</p>
          <div className="flex gap-2">
            <button
              onClick={() => setTeacherPage((previous) => Math.max(previous - 1, 1))}
              className="rounded border border-slate-200 px-2 py-1"
            >
              Prev
            </button>
            <span>Page {teacherPage}</span>
            <button
              onClick={() => setTeacherPage((previous) => previous + 1)}
              className="rounded border border-slate-200 px-2 py-1"
            >
              Next
            </button>
          </div>
        </div>
      </section>
      ) : null}

      {activeSection === "students" ? (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">Student Directory</h3>
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
              {students.map((student) => (
                <tr key={student._id} className="border-b border-slate-100">
                  <td className="py-2">{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.role}</td>
                  <td>{student.isActive ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      ) : null}

      {(activeSection === "dashboard" || activeSection === "activity-logs") ? (
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
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <p>Total activities: {logTotal}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setLogPage((previous) => Math.max(previous - 1, 1))}
              className="rounded border border-slate-200 px-2 py-1"
            >
              Prev
            </button>
            <span>Page {logPage}</span>
            <button
              onClick={() => setLogPage((previous) => previous + 1)}
              className="rounded border border-slate-200 px-2 py-1"
            >
              Next
            </button>
          </div>
        </div>
      </section>
      ) : null}
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
