"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Sub = { team_id: number; status: string; submitted_at: string | null; remarks: string | null };
type TeamLite = { id: number; name: string; project_title: string | null };

export default function SubmissionsTable() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [teams, setTeams] = useState<TeamLite[]>([]);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from("final_submissions").select("*").order("submitted_at", { ascending: false });
      const { data: t } = await supabase.from("teams").select("id,name,project_title");
      setSubs((s as Sub[]) ?? []);
      setTeams((t as TeamLite[]) ?? []);
    })();
  }, []);

  const team = (id: number) => teams.find((t) => t.id === id);

  return (
    <section className="card mt-6 overflow-x-auto">
      <div className="card-title">🏁 Final Submissions</div>
      <p className="text-sm text-slate-500 mb-3">{subs.length} of {teams.length} teams have submitted</p>
      <table className="clean">
        <thead>
          <tr><th>Team</th><th>Project</th><th>Status</th><th>Submitted</th><th>Remarks</th></tr>
        </thead>
        <tbody>
          {subs.map((s) => (
            <tr key={s.team_id}>
              <td className="font-semibold">{team(s.team_id)?.name}</td>
              <td>{team(s.team_id)?.project_title}</td>
              <td><span className="badge bg-green-100 text-green-700">{s.status}</span></td>
              <td>{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : "-"}</td>
              <td>{s.remarks ?? "-"}</td>
            </tr>
          ))}
          {subs.length === 0 && (
            <tr><td colSpan={5} className="text-slate-400">No submissions yet.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}