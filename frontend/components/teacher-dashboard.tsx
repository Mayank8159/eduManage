"use client";

import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export function TeacherDashboard() {
  const { token } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [classData, setClassData] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    if (!token) return;

    api
      .get("/teacher/classes", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setClasses(data || []);
        if (data?.length) setSelectedClass(data[0]._id);
      })
      .catch(() => setClasses([]));
  }, [token]);

  useEffect(() => {
    if (!token || !selectedClass) return;

    api
      .get(`/teacher/classes/${selectedClass}/students`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => setClassData(data))
      .catch(() => setClassData(null));
  }, [token, selectedClass]);

  const uploadAttendance = async (studentId: string, status: "present" | "absent") => {
    if (!token || !selectedClass) return;

    await api.post(
      "/teacher/attendance",
      {
        student: studentId,
        classId: selectedClass,
        date: new Date().toISOString(),
        status,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  const uploadMark = async (studentId: string, score: number) => {
    if (!token || !selectedClass) return;

    await api.post(
      "/teacher/marks",
      {
        student: studentId,
        classId: selectedClass,
        subject: classData.class.subject,
        score,
        maxScore: 100,
        examType: "Class Assessment",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  };

  const runPrediction = async (studentId: string) => {
    if (!token || !selectedClass) return;

    const { data } = await api.get(`/teacher/classes/${selectedClass}/students/${studentId}/predict`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setPrediction(data);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">Teacher Workspace</h2>
        <p className="text-sm text-slate-500">Manage classes, attendance, marks, and AI insights.</p>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-slate-600">Assigned Class</label>
        <select
          value={selectedClass}
          onChange={(event) => setSelectedClass(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
        >
          {classes.map((cls) => (
            <option key={cls._id} value={cls._id}>
              {cls.name} {cls.section} - {cls.subject}
            </option>
          ))}
        </select>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">Student Data</h3>
        <div className="space-y-3">
          {classData?.students?.map((entry: any) => (
            <div key={entry.student._id} className="rounded-xl border border-slate-100 p-3">
              <p className="font-medium text-slate-800">{entry.student.name}</p>
              <p className="text-xs text-slate-500">{entry.student.email}</p>
              <p className="mt-2 text-xs text-slate-600">
                Insight: {entry.insight.predictionLabel} ({entry.insight.attendanceRatio}% attendance)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => uploadAttendance(entry.student._id, "present")}
                  className="rounded-lg bg-teal-600 px-2 py-1 text-xs font-semibold text-white"
                >
                  Mark Present
                </button>
                <button
                  onClick={() => uploadAttendance(entry.student._id, "absent")}
                  className="rounded-lg bg-rose-600 px-2 py-1 text-xs font-semibold text-white"
                >
                  Mark Absent
                </button>
                <button
                  onClick={() => uploadMark(entry.student._id, Math.floor(Math.random() * 30 + 60))}
                  className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white"
                >
                  Upload Marks
                </button>
                <button
                  onClick={() => runPrediction(entry.student._id)}
                  className="rounded-lg bg-amber-600 px-2 py-1 text-xs font-semibold text-white"
                >
                  Simulate AI
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 font-semibold text-slate-800">Class Marks Trend</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={
                classData?.students?.map((entry: any) => ({
                  name: entry.student.name,
                  marksTrend: entry.insight.marksTrend,
                })) || []
              }
            >
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line dataKey="marksTrend" stroke="#0e7490" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {prediction ? (
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-slate-800">Simulation Result</h3>
          <p className="mt-2 text-sm text-slate-600">{prediction.student.name}</p>
          <p className="text-sm font-medium text-slate-800">{prediction.insight.predictionLabel}</p>
          <p className="text-sm text-slate-500">{prediction.insight.recommendation}</p>
        </section>
      ) : null}
    </div>
  );
}
