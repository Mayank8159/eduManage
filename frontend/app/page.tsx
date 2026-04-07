"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { login, session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && session) {
      router.replace("/dashboard");
    }
  }, [loading, session, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await login(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message || "Unable to login");
      return;
    }

    router.push("/dashboard");
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-slate-50 lg:grid-cols-2">
      <section className="relative overflow-hidden bg-slate-950 p-10 text-white">
        <div className="hero-glow" />
        <div className="relative z-10 max-w-lg">
          <p className="inline-block rounded-full border border-cyan-400/40 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-300">
            Production Suite
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-5xl">
            EduManage
            <span className="block text-cyan-300">School Command Platform</span>
          </h1>
          <p className="mt-5 text-sm text-slate-300 md:text-base">
            Unified management for principals, teachers, and students with AI-based performance simulation,
            activity tracking, and analytics-driven reporting.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-200 md:grid-cols-2">
            <InfoChip text="JWT + Refresh Auth" />
            <InfoChip text="Role-Based Dashboards" />
            <InfoChip text="Teacher Activity Logs" />
            <InfoChip text="Student Risk Simulation" />
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center p-6 md:p-12">
        <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg md:p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Sign In</h2>
          <p className="mt-1 text-sm text-slate-500">Use seeded credentials to explore each role dashboard.</p>

          <div className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
          </div>

          {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>

          <div className="mt-5 space-y-1 text-xs text-slate-500">
            <p>Principal: principal@school.com</p>
            <p>Teacher: teacher1@school.com</p>
            <p>Student: student1@school.com</p>
            <p>Password: Password@123</p>
          </div>
        </form>
      </section>
    </div>
  );
}

function InfoChip({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2">
      {text}
    </div>
  );
}
