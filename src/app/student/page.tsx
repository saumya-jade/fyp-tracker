"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Steps from "@/components/Steps";

type Team = {
  id: number; name: string; project_title: string | null; description: string | null;
  domain: string | null; pref1: number | null; pref2: number | null; pref3: number | null;
  guide_id: number | null; allocation_reason: string | null;
};
type Guide = { id: number; name: string; capacity: number; existing_load: number };
type Member = { id: number; member_name: string; roll_no: string | null };
type Log = { id: number; week_no: number; summary: string; progress_percent: number | null };
type Doc = { id: number; doc_type: string | null; file_name: string; storage_path: string };
type Review = { id: number; title: string; review_date: string; venue: string | null };
type Slot = { id: number; team_id: number | null; start_time: string; end_time: string };

const DOMAINS = ["AI/ML", "Web", "IoT", "Cloud", "Data", "Security"];
const DOC_TYPES = ["Proposal", "Report", "PPT", "Code", "Other"];

export default function StudentPage() {
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [msg, setMsg] = useState("");

  const [tName, setTName] = useState("");
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tDomain, setTDomain] = useState(DOMAINS[0]);
  const [mem, setMem] = useState([
    { name: "", roll: "" }, { name: "", roll: "" }, { name: "", roll: "" }, { name: "", roll: "" },
  ]);

  const [prefs, setPrefs] = useState<string[]>(["", "", ""]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [weekNo, setWeekNo] = useState(1);
  const [summary, setSummary] = useState("");
  const [percent, setPercent] = useState(0);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docType, setDocType] = useState(DOC_TYPES[0]);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState<{ status: string; remarks: string | null } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [review, setReview] = useState<Review | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);

  const loadBase = useCallback(async () => {
    const { data: t } = await supabase.from("teams").select("*").order("id");
    const { data: g } = await supabase.from("guides").select("id,name,capacity,existing_load").order("name");
    setAllTeams((t as Team[]) ?? []);
    setGuides((g as Guide[]) ?? []);
  }, []);

  const loadTeam = useCallback(async (id: number) => {
    const { data: t } = await supabase.from("teams").select("*").eq("id", id).single();
    if (!t) return;
    const tm = t as Team;
    setTeam(tm);
    setPrefs([tm.pref1, tm.pref2, tm.pref3].map((p) => (p ? String(p) : "")));

    const { data: m } = await supabase.from("team_members").select("id,member_name,roll_no").eq("team_id", id);
    setMembers((m as Member[]) ?? []);

    const { data: l } = await supabase.from("progress_logs").select("*").eq("team_id", id).order("week_no", { ascending: false });
    const lg = (l as Log[]) ?? [];
    setLogs(lg);
    setWeekNo(lg.length ? Math.max(...lg.map((x) => x.week_no)) + 1 : 1);

    const { data: d } = await supabase.from("documents").select("*").eq("team_id", id).order("created_at", { ascending: false });
    setDocs((d as Doc[]) ?? []);

    const { data: s } = await supabase.from("final_submissions").select("status,remarks").eq("team_id", id).maybeSingle();
    setSubmitted(s ?? null);

    const today = new Date().toISOString().slice(0, 10);
    const { data: r } = await supabase.from("reviews").select("*").gte("review_date", today).order("review_date").limit(1).maybeSingle();
    setReview((r as Review) ?? null);
    if (r) {
      const { data: sl } = await supabase.from("review_slots").select("id,team_id,start_time,end_time").eq("review_id", r.id).order("start_time");
      setSlots((sl as Slot[]) ?? []);
    } else setSlots([]);
  }, []);

  useEffect(() => {
    loadBase();
    const saved = localStorage.getItem("fyp_team_id");
    if (saved) setTeamId(Number(saved));
  }, [loadBase]);

  useEffect(() => {
    if (teamId) { localStorage.setItem("fyp_team_id", String(teamId)); loadTeam(teamId); }
    else { setTeam(null); }
  }, [teamId, loadTeam]);

  async function createTeam() {
    const people = mem.filter((m) => m.name.trim());
    if (!tName.trim()) return setMsg("Please enter a team name.");
    if (people.length < 1) return setMsg("Add at least one team member.");
    const { data: t, error } = await supabase.from("teams")
      .insert({ name: tName, project_title: tTitle || null, description: tDesc || null, domain: tDomain })
      .select().single();
    if (error || !t) return setMsg("Error: " + error?.message);
    const { error: e2 } = await supabase.from("team_members").insert(
      people.map((p) => ({ team_id: t.id, member_name: p.name, roll_no: p.roll || null }))
    );
    if (e2) return setMsg("Members error: " + e2.message);
    setMsg("Team created successfully ✅");
    setTName(""); setTTitle(""); setTDesc("");
    setMem(mem.map(() => ({ name: "", roll: "" })));
    await loadBase();
    setTeamId(t.id);
  }

  async function savePrefs() {
    if (!team) return;
    if (prefs.some((p) => !p)) return setMsg("Please select all three preferences.");
    if (new Set(prefs).size !== 3) return setMsg("The three guides must be different.");
    const { error } = await supabase.from("teams")
      .update({ pref1: Number(prefs[0]), pref2: Number(prefs[1]), pref3: Number(prefs[2]) })
      .eq("id", team.id);
    setMsg(error ? "Error: " + error.message : "Preferences saved ✅");
    loadTeam(team.id);
  }

  async function addLog() {
    if (!team || !summary.trim()) return setMsg("Please write a summary.");
    const { error } = await supabase.from("progress_logs")
      .insert({ team_id: team.id, week_no: weekNo, summary, progress_percent: percent });
    if (error) return setMsg("Error: " + error.message);
    setSummary(""); setMsg("Progress log added ✅");
    loadTeam(team.id);
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !team) return;
    setUploading(true);
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `team_${team.id}/${Date.now()}_${safe}`;
    const { error } = await supabase.storage.from("documents").upload(path, file);
    if (error) { setUploading(false); return setMsg("Upload error: " + error.message); }
    const { error: e2 } = await supabase.from("documents")
      .insert({ team_id: team.id, doc_type: docType, file_name: file.name, storage_path: path });
    setUploading(false);
    e.target.value = "";
    setMsg(e2 ? "DB error: " + e2.message : "File uploaded ✅");
    loadTeam(team.id);
  }

  async function finalSubmit() {
    if (!team) return;
    if (!confirm("You cannot change this after final submission. Continue?")) return;
    const { error } = await supabase.from("final_submissions").insert({
      team_id: team.id, status: "Submitted",
      submitted_at: new Date().toISOString(), remarks: remarks || null,
    });
    setMsg(error ? "Error: " + error.message : "Final submission recorded 🎉");
    loadTeam(team.id);
  }

  async function bookSlot(slotId: number) {
    if (!team) return;
    if (slots.some((s) => s.team_id === team.id)) return setMsg("Your team has already booked a slot.");
    const { data, error } = await supabase.from("review_slots")
      .update({ team_id: team.id }).eq("id", slotId).is("team_id", null).select();
    setMsg(error || !data?.length ? "That slot was just taken. Please pick another." : "Slot booked ✅");
    loadTeam(team.id);
  }

  const guideName = (id: number | null) => guides.find((g) => g.id === id)?.name;

  return (
    <main className="page-narrow">
      <h1 className="page-title">Student Portal</h1>
      <p className="page-sub">Manage your team, guide preferences, progress and submission.</p>

      {msg && <div className="msg">{msg}</div>}

      <div className="card">
        <div className="card-title">👥 Select your team</div>
        <select className="input" value={teamId ?? ""} onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : null)}>
          <option value="">-- select team --</option>
          {allTeams.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.project_title}</option>)}
        </select>
      </div>

      {!team && (
        <div className="card">
          <div className="card-title">➕ Or create a new team</div>
          <div className="grid gap-2">
            <input className="input" placeholder="Team name" value={tName} onChange={(e) => setTName(e.target.value)} />
            <input className="input" placeholder="Project title" value={tTitle} onChange={(e) => setTTitle(e.target.value)} />
            <textarea className="input" placeholder="Short description" value={tDesc} onChange={(e) => setTDesc(e.target.value)} />
            <select className="input" value={tDomain} onChange={(e) => setTDomain(e.target.value)}>
              {DOMAINS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <p className="text-sm text-slate-500 mt-2">Team members (max 4)</p>
            {mem.map((m, i) => (
              <div key={i} className="grid grid-cols-2 gap-2">
                <input className="input" placeholder={`Member ${i + 1} name`} value={m.name}
                  onChange={(e) => setMem(mem.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <input className="input" placeholder="Roll number" value={m.roll}
                  onChange={(e) => setMem(mem.map((x, j) => (j === i ? { ...x, roll: e.target.value } : x)))} />
              </div>
            ))}
            <div><button className="btn mt-2" onClick={createTeam}>Create Team</button></div>
          </div>
        </div>
      )}

      {team && (
        <>
          <Steps
            items={[
              { label: "Team", done: true },
              { label: "Preferences", done: !!team.pref1 },
              { label: "Progress", done: logs.length > 0 },
              { label: "Documents", done: docs.length > 0 },
              { label: "Review", done: slots.some((s) => s.team_id === team.id) },
              { label: "Submit", done: !!submitted },
            ]}
          />

          <div className="card" style={{ background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", border: 0 }}>
            <h2 className="text-xl font-bold">{team.name}: {team.project_title}</h2>
            <p className="text-indigo-100 text-sm mb-3">{team.domain} · {team.description}</p>
            <p className="text-sm">
              <b>Members:</b>{" "}
              {members.map((m) => `${m.member_name}${m.roll_no ? ` (${m.roll_no})` : ""}`).join(", ") || "No members added"}
            </p>
            <p className="text-sm mt-2">
              <b>Allocated guide:</b>{" "}
              {team.guide_id ? <span className="badge bg-white text-indigo-700">{guideName(team.guide_id)}</span> : "Not allocated yet"}
            </p>
            {team.allocation_reason && <p className="text-xs text-indigo-100 mt-2">Why: {team.allocation_reason}</p>}
          </div>

          <div className="card">
            <div className="card-title">🎯 Guide preferences (top 3)</div>
            <div className="grid gap-2">
              {[0, 1, 2].map((i) => (
                <select key={i} className="input" value={prefs[i]}
                  onChange={(e) => { const n = [...prefs]; n[i] = e.target.value; setPrefs(n); }}>
                  <option value="">-- Preference {i + 1} --</option>
                  {guides.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} (free seats: {g.capacity - g.existing_load})</option>
                  ))}
                </select>
              ))}
              <div><button className="btn mt-1" onClick={savePrefs}>Save Preferences</button></div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">📈 Weekly progress log</div>
            <div className="flex gap-2 mb-3">
              <input type="number" min={1} className="input" style={{ width: 90 }} value={weekNo} onChange={(e) => setWeekNo(Number(e.target.value))} />
              <input className="input" placeholder="What did your team do this week?" value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <label className="text-sm block mb-3">Overall progress: <b className="text-indigo-700">{percent}%</b>
              <input type="range" min={0} max={100} className="w-full" value={percent} onChange={(e) => setPercent(Number(e.target.value))} />
            </label>
            <button className="btn" onClick={addLog}>Add Log</button>
            <ul className="text-sm mt-4">
              {logs.map((l) => (
                <li key={l.id} className="border-t py-2 flex justify-between gap-3">
                  <span><b>Week {l.week_no}:</b> {l.summary}</span>
                  <span className="badge bg-indigo-100 text-indigo-700">{l.progress_percent ?? 0}%</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="card-title">📎 Documents</div>
            <div className="flex gap-2 items-center mb-3">
              <select className="input" style={{ width: 150 }} value={docType} onChange={(e) => setDocType(e.target.value)}>
                {DOC_TYPES.map((d) => <option key={d}>{d}</option>)}
              </select>
              <input type="file" className="text-sm" onChange={uploadFile} disabled={uploading} />
            </div>
            {uploading && <p className="text-sm text-indigo-600">Uploading...</p>}
            <ul className="text-sm">
              {docs.map((d) => {
                const url = supabase.storage.from("documents").getPublicUrl(d.storage_path).data.publicUrl;
                return (
                  <li key={d.id} className="border-t py-2 flex items-center gap-2">
                    <span className="badge bg-violet-100 text-violet-700">{d.doc_type}</span>
                    <a className="text-indigo-600 underline" href={url} target="_blank">{d.file_name}</a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="card">
            <div className="card-title">📅 Next review</div>
            {!review ? (
              <p className="text-slate-500 text-sm">No upcoming review has been scheduled yet.</p>
            ) : (
              <>
                <p className="mb-3 text-sm"><b>{review.title}</b> · {review.review_date}{review.venue ? ` · ${review.venue}` : ""}</p>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s) => {
                    const mine = s.team_id === team.id;
                    const taken = !!s.team_id && !mine;
                    return (
                      <button key={s.id} disabled={taken || mine} onClick={() => bookSlot(s.id)}
                        className={`slot ${mine ? "mine" : taken ? "taken" : ""}`}>
                        {s.start_time}–{s.end_time}{mine ? " ✔ yours" : taken ? " (taken)" : ""}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div className="card-title">🏁 Final submission</div>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800 font-semibold">
                ✅ Submitted ({submitted.status}){submitted.remarks ? ` — ${submitted.remarks}` : ""}
              </div>
            ) : (
              <div className="grid gap-2">
                <textarea className="input" placeholder="Remarks or GitHub repository link" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                <div><button className="btn" onClick={finalSubmit}>Final Submit</button></div>
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}