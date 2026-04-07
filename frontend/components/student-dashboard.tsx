"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function StudentDashboard() {
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const [chartsReady, setChartsReady] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const activeSection = searchParams.get("section") || "dashboard";

  useEffect(() => {
    setChartsReady(true);
  }, []);

  useEffect(() => {
    if (!token) return;

    let active = true;

    const loadStudentData = async () => {
      try {
        const [dashboardRes, notificationsRes] = await Promise.all([
          api.get("/student/dashboard", { headers: { Authorization: `Bearer ${token}` } }),
          api.get("/notifications?page=1&limit=6", { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (!active) return;

        setDashboard(dashboardRes.data);
        setNotifications(notificationsRes.data.items || []);
      } catch {
        if (!active) return;
        setDashboard(null);
        setNotifications([]);
      }
    };

    void loadStudentData();

    const interval = setInterval(() => {
      void api
        .get("/notifications?page=1&limit=6", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (!active) return;
          setNotifications(res.data.items || []);
        })
        .catch(() => {
          if (!active) return;
          setNotifications([]);
        });
    }, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [token]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">Student Dashboard</h2>
        <p className="text-sm text-slate-500">Track marks, attendance, and teacher feedback.</p>
      </section>

      {(activeSection === "dashboard" || activeSection === "attendance") ? (
      <section className="grid gap-4 md:grid-cols-3">
        <Metric title="Attendance Ratio" value={`${dashboard?.insight?.attendanceRatio || 0}%`} />
        <Metric title="Marks Trend" value={`${dashboard?.insight?.marksTrend || 0}%`} />
        <Metric title="Prediction" value={dashboard?.insight?.predictionLabel || "-"} />
      </section>
      ) : null}

      {(activeSection === "dashboard" || activeSection === "my-reports") ? (
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">Performance Chart</h3>
        <div className="h-72 min-w-0">
          {chartsReady ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={240}>
            <AreaChart
              data={
                dashboard?.marks?.map((mark: any, index: number) => ({
                  name: `${index + 1}`,
                  score: Number(((mark.score / mark.maxScore) * 100).toFixed(2)),
                })) || []
              }
            >
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Area dataKey="score" stroke="#16a34a" fill="#bbf7d0" />
            </AreaChart>
          </ResponsiveContainer>
          ) : <div className="h-full min-h-[240px] w-full" />}
        </div>
      </section>
      ) : null}

      {(activeSection === "dashboard" || activeSection === "feedback") ? (
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">Teacher Feedback</h3>
          <div className="space-y-2 text-sm">
            {dashboard?.feedback?.map((item: any) => (
              <div key={item._id} className="rounded-lg border border-slate-100 p-2">
                <p className="font-medium text-slate-800">{item.teacher?.name}</p>
                <p className="text-slate-500">{item.comment}</p>
                <p className="text-xs text-slate-400">Rating: {item.rating}/5</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 font-semibold text-slate-800">Notifications</h3>
          <div className="space-y-2 text-sm">
            {notifications.map((item) => (
              <div key={item._id} className="rounded-lg border border-slate-100 p-2">
                <p className="font-medium text-slate-800">{item.title}</p>
                <p className="text-slate-500">{item.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      ) : null}
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs uppercase text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}
