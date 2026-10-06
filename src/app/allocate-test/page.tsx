"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { allocate, Assignment } from "@/lib/allocate";

export default function AllocateTest() {
  const [res, setRes] = useState<Assignment[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function run() {
    const { data: teams, error: e1 } = await supabase.from("teams").select("*").order("id");
    const { data: guides, error: e2 } = await supabase.from("guides").select("*").order("id");
    if (e1 || e2) {
      setMsg("Error: " + (e1?.message || e2?.message));
      return;
    }
    setRes(allocate(teams!, guides!));
    setMsg("Preview ready. Click Publish to save these allocations to the database.");
  }

  async function save() {
    setSaving(true);
    for (const r of res) {
      await supabase
        .from("teams")
        .update({ guide_id: r.guideId, allocation_reason: r.reason })
        .eq("id", r.teamId);
    }
    setSaving(false);
    setMsg("Allocations published to the database ✅");
  }

  const allocated = res.filter((r) => r.guideName).length;
  const unallocated = res.length - allocated;

  const choiceBadge = (label: string | number | null | undefined) => {
    const text = String(label ?? "-");
    if (text === "1") return "bg-green-100 text-green-700";
    if (text === "2") return "bg-blue-100 text-blue-700";
    if (text === "3") return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <main className="page">
      <h1 className="page-title">Guide Allocation</h1>
      <p className="page-sub">
        Fair allocation based on team preferences, domain match and guide capacity limits.
      </p>

      {msg && <div className="msg">{msg}</div>}

      <div className="flex gap-3 mb-6">
        <button onClick={run} className="btn">▶ Run Allocation</button>
        {res.length > 0 && (
          <button
            onClick={save}
            disabled={saving}
            className="btn"
            style={{ background: "linear-gradient(135deg,#16a34a,#15803d)" }}
          >
            {saving ? "Publishing..." : "✔ Publish"}
          </button>
        )}
      </div>

      {res.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-md border-t-4 border-indigo-500 p-4">
            <p className="text-sm text-slate-500">Total Teams</p>
            <p className="text-3xl font-extrabold text-indigo-700">{res.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md border-t-4 border-green-500 p-4">
            <p className="text-sm text-slate-500">Allocated</p>
            <p className="text-3xl font-extrabold text-green-600">{allocated}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-md border-t-4 border-red-500 p-4">
            <p className="text-sm text-slate-500">Unallocated</p>
            <p className="text-3xl font-extrabold text-red-600">{unallocated}</p>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <div className="card-title">📋 Allocation Result</div>
        <table className="clean">
          <thead>
            <tr>
              <th>Team</th>
              <th>Guide</th>
              <th>Choice</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {res.map((r) => (
              <tr key={r.teamId} className="align-top">
                <td className="font-semibold">{r.teamName}</td>
                <td>
                  {r.guideName ? (
                    <span className="badge bg-indigo-100 text-indigo-700">{r.guideName}</span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${choiceBadge(r.rank ?? r.source)}`}>
                    {r.rank ? `Preference ${r.rank}` : String(r.source ?? "-")}
                  </span>
                </td>
                <td className="whitespace-pre-line text-slate-600" style={{ maxWidth: 420 }}>
                  {r.reason}
                </td>
              </tr>
            ))}
            {res.length === 0 && (
              <tr>
                <td colSpan={4} className="text-slate-400">
                  No results yet. Click &quot;Run Allocation&quot; to generate a preview.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}