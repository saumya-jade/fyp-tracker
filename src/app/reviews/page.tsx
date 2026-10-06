"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Review = { id: number; title: string; review_date: string; venue: string | null };
type Slot = { id: number; review_id: number; team_id: number | null; start_time: string; end_time: string };
type TeamLite = { id: number; name: string };

const fmt = (mins: number) =>
  `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [teams, setTeams] = useState<TeamLite[]>([]);
  const [title, setTitle] = useState("Review 1");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [duration, setDuration] = useState(20);
  const [count, setCount] = useState(8);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data: r } = await supabase.from("reviews").select("*").order("review_date", { ascending: false });
    const { data: s } = await supabase.from("review_slots").select("*").order("start_time");
    const { data: t } = await supabase.from("teams").select("id,name");
    setReviews((r as Review[]) ?? []);
    setSlots((s as Slot[]) ?? []);
    setTeams((t as TeamLite[]) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createReview() {
    if (!title || !date) return setMsg("Title and date are required.");
    const { data: r, error } = await supabase.from("reviews")
      .insert({ title, review_date: date, venue: venue || null }).select().single();
    if (error || !r) return setMsg("Error: " + error?.message);

    const [h, m] = startTime.split(":").map(Number);
    const start = h * 60 + m;
    const rows = Array.from({ length: count }, (_, i) => ({
      review_id: r.id,
      start_time: fmt(start + i * duration),
      end_time: fmt(start + (i + 1) * duration),
    }));
    const { error: e2 } = await supabase.from("review_slots").insert(rows);
    setMsg(e2 ? "Slot error: " + e2.message : `Review created with ${count} slots ✅`);
    load();
  }

  async function deleteReview(id: number) {
    if (!confirm("Delete this review and its slots?")) return;
    await supabase.from("review_slots").delete().eq("review_id", id);
    await supabase.from("reviews").delete().eq("id", id);
    load();
  }

  async function release(slotId: number) {
    await supabase.from("review_slots").update({ team_id: null }).eq("id", slotId);
    load();
  }

  const teamName = (id: number | null) => teams.find((t) => t.id === id)?.name;

  return (
    <main className="page-narrow">
      <h1 className="page-title">Review Scheduling</h1>
      <p className="page-sub">Create a review session with time slots. Teams book slots from the student portal.</p>
      {msg && <div className="msg">{msg}</div>}

      <div className="card">
        <div className="card-title">🗓️ Create a new review</div>
        <div className="grid gap-2">
          <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <input className="input" placeholder="Venue (e.g. Lab 101)" value={venue} onChange={(e) => setVenue(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm text-slate-600">Slot duration (minutes)
              <input type="number" className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </label>
            <label className="text-sm text-slate-600">Number of slots
              <input type="number" className="input" value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </label>
          </div>
          <div><button className="btn mt-1" onClick={createReview}>Create Review + Slots</button></div>
        </div>
      </div>

      {reviews.map((r) => (
        <div key={r.id} className="card">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-bold text-lg">{r.title}</div>
              <div className="text-sm text-slate-500">{r.review_date}{r.venue ? ` · ${r.venue}` : ""}</div>
            </div>
            <button className="btn-danger" onClick={() => deleteReview(r.id)}>Delete</button>
          </div>
          <table className="clean">
            <thead><tr><th>Time</th><th>Team</th><th></th></tr></thead>
            <tbody>
              {slots.filter((s) => s.review_id === r.id).map((s) => (
                <tr key={s.id}>
                  <td>{s.start_time} – {s.end_time}</td>
                  <td>
                    {s.team_id
                      ? <span className="badge bg-indigo-100 text-indigo-700">{teamName(s.team_id)}</span>
                      : <span className="badge bg-green-100 text-green-700">Free</span>}
                  </td>
                  <td className="text-right">
                    {s.team_id && <button className="btn-danger" onClick={() => release(s.id)}>Release</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </main>
  );
}