"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SubmissionsTable from "@/components/SubmissionsTable";

type Guide = { id: number; name: string; capacity: number; existing_load: number };
type Team = { id: number; name: string; project_title: string; guide_id: number | null };
type Log = { team_id: number; week_no: number; progress_percent: number };

function statusOf(gap: number) {
  if (gap <= 10) return { label: "On Track", cls: "bg-green-100 text-green-700", bar: "bg-green-500" };
  if (gap <= 25) return { label: "At Risk", cls: "bg-yellow-100 text-yellow-700", bar: "bg-yellow-500" };
  return { label: "Behind", cls: "bg-red-100 text-red-700", bar: "bg-red-500" };
}

export default function Coordinator() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [upcoming, setUpcoming] = useState(0);
  const [submitted, setSubmitted] = useState(0);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const [g, t, l, r, s] = await Promise.all([
        supabase.from("guides").select("*").order("id"),
        supabase.from("teams").select("id,name,project_title,guide_id").order("id"),
        supabase.from("progress_logs").select("team_id,week_no,progress_percent"),
        supabase.from("reviews").select("id").gte("review_date", today),
        supabase.from("final_submissions").select("team_id"),
      ]);
      setGuides(g.data || []);
      setTeams(t.data || []);
      setLogs(l.data || []);
      setUpcoming(r.data?.length || 0);
      setSubmitted(s.data?.length || 0);
    }
    load();
  }, []);

  const currentWeek = logs.length ? Math.max(...logs.map((x) => x.week_no)) : 1;
  const expected = Math.min(100, currentWeek * 13);

  const rows = teams
    .map((t) => {
      const mine = logs.filter((x) => x.team_id === t.id).sort((a, b) => b.week_no - a.week_no);
      const actual = mine.length ? mine[0].progress_percent : 0;
      const gap = expected - actual;
      return { ...t, actual, gap, st: statusOf(gap), guide: guides.find((g) => g.id === t.guide_id)?.name };
    })
    .sort((a, b) => b.gap - a.gap);

  const behind = rows.filter((r) => r.st.label === "Behind").length;
  const atRisk = rows.filter((r) => r.st.label === "At Risk").length;
  const pending = teams.length - submitted;

  const kpis = [
    { label: "Total Teams", value: teams.length, icon: "👥", color: "border-indigo-500", text: "text-indigo-700" },
    { label: "Total Guides", value: guides.length, icon: "🧑‍🏫", color: "border-violet-500", text: "text-violet-700" },
    { label: "Upcoming Reviews", value: upcoming, icon: "📅", color: "border-blue-500", text: "text-blue-700" },
    { label: "Pending Submissions", value: pending, icon: "📝", color: "border-amber-500", text: "text-amber-600" },
    { label: "Teams Behind", value: behind, icon: "⚠️", color: "border-red-500", text: "text-red-600" },
  ];

  return (
    <main className="page">
      <h1 className="page-title">Coordinator Dashboard</h1>
      <p className="page-sub">
        Week {currentWeek} · Expected progress: {expected}% · {behind} behind, {atRisk} at risk
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className={`bg-white rounded-2xl shadow-md border-t-4 ${k.color} p-4`}>
            <div className="flex justify-between items-center">
              <p className="text-sm text-slate-500">{k.label}</p>
              <span className="text-xl">{k.icon}</span>
            </div>
            <p className={`text-3xl font-extrabold mt-1 ${k.text}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="card md:col-span-1" style={{ marginBottom: 0 }}>
          <div className="card-title">⚖️ Guide Workload</div>
          {guides.map((g) => {
            const load = g.existing_load + teams.filter((t) => t.guide_id === g.id).length;
            const pct = Math.min(100, (load / g.capacity) * 100);
            const full = load >= g.capacity;
            return (
              <div key={g.id} className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{g.name}</span>
                  <span className={full ? "text-red-600 font-semibold" : "text-slate-500"}>
                    {load}/{g.capacity}{full ? " FULL" : ""}
                  </span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full">
                  <div className={`h-2.5 rounded-full ${full ? "bg-red-500" : "bg-indigo-500"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="card md:col-span-2 overflow-x-auto" style={{ marginBottom: 0 }}>
          <div className="card-title">📊 Team Progress (worst first)</div>
          <table className="clean">
            <thead>
              <tr><th>Team</th><th>Guide</th><th style={{ width: 200 }}>Progress</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.project_title}</div>
                  </td>
                  <td>{r.guide ?? "-"}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="relative h-2.5 bg-slate-100 rounded-full flex-1">
                        <div className={`h-2.5 rounded-full ${r.st.bar}`} style={{ width: `${r.actual}%` }} />
                        <div className="absolute top-[-3px] h-4 w-0.5 bg-slate-700" style={{ left: `${expected}%` }} title="Expected" />
                      </div>
                      <span className="w-10 text-right">{r.actual}%</span>
                    </div>
                  </td>
                  <td><span className={`badge ${r.st.cls}`}>{r.st.label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-400 mt-3">
            Black marker = expected progress this week. Behind means 25+ points below expected.
          </p>
        </div>
      </div>

      <SubmissionsTable />
    </main>
  );
}