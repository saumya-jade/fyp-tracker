export type Guide = { id: number; name: string; domains: string[]; capacity: number; existing_load: number };
export type Team = { id: number; name: string; domain: string | null; pref1: number | null; pref2: number | null; pref3: number | null };
export type Assignment = {
  teamId: number; teamName: string; guideId: number | null; guideName: string | null;
  rank: number | null; source: "preference" | "fallback" | "unallocated"; reason: string;
};

// Guide ke liye team ki priority: domain match pehle, phir chhota team id (deterministic)
function key(t: Team, g: Guide) {
  const match = t.domain && g.domains.includes(t.domain) ? 0 : 1;
  return match * 100000 + t.id;
}

export function allocate(teams: Team[], guides: Guide[]): Assignment[] {
  const gmap = new Map(guides.map((g) => [g.id, g]));
  const cap = new Map(guides.map((g) => [g.id, Math.max(0, g.capacity - g.existing_load)]));
  const held = new Map<number, Team[]>(guides.map((g) => [g.id, []]));
  const next = new Map<number, number>(teams.map((t) => [t.id, 0]));
  const trace = new Map<number, string[]>(teams.map((t) => [t.id, []]));
  const prefsOf = (t: Team) => [t.pref1, t.pref2, t.pref3].filter((x): x is number => x != null);
  const label = (t: Team) => {
    const i = next.get(t.id)! - 1;
    return `Preference ${i + 1} (${gmap.get(prefsOf(t)[i])!.name})`;
  };

  // Deferred acceptance: teams propose, guides keep best teams up to capacity
  const queue = [...teams];
  while (queue.length) {
    const t = queue.shift()!;
    const prefs = prefsOf(t);
    const i = next.get(t.id)!;
    if (i >= prefs.length) continue;
    next.set(t.id, i + 1);
    const g = gmap.get(prefs[i]);
    if (!g) { queue.push(t); continue; }
    if (cap.get(g.id)! === 0) {
      trace.get(t.id)!.push(`${label(t)}: full, no slots left`);
      queue.push(t);
      continue;
    }
    const list = held.get(g.id)!;
    list.push(t);
    if (list.length > cap.get(g.id)!) {
      list.sort((a, b) => key(a, g) - key(b, g));
      const out = list.pop()!;
      trace.get(out.id)!.push(`${label(out)}: slots went to teams with better domain match / priority`);
      queue.push(out);
    }
  }

  const placed = new Map<number, number>();
  guides.forEach((g) => held.get(g.id)!.forEach((t) => placed.set(t.id, g.id)));

  // Fallback: koi bhi preference nahi mili to sabse zyada free slots wala guide
  const freeSlots = (g: Guide) => cap.get(g.id)! - held.get(g.id)!.length;
  const fallbackIds = new Set<number>();
  teams.forEach((t) => {
    if (placed.has(t.id)) return;
    const options = guides.filter((g) => freeSlots(g) > 0)
      .sort((a, b) => {
        const ma = t.domain && a.domains.includes(t.domain) ? 0 : 1;
        const mb = t.domain && b.domains.includes(t.domain) ? 0 : 1;
        return ma - mb || freeSlots(b) - freeSlots(a);
      });
    if (options.length) {
      held.get(options[0].id)!.push(t);
      placed.set(t.id, options[0].id);
      fallbackIds.add(t.id);
    }
  });

  return teams.map((t): Assignment => {
    const gid = placed.get(t.id);
    if (gid == null) {
      return { teamId: t.id, teamName: t.name, guideId: null, guideName: null, rank: null, source: "unallocated",
        reason: [...trace.get(t.id)!, "No guide with free capacity. Coordinator action needed."].join("\n") };
    }
    const g = gmap.get(gid)!;
    const load = g.existing_load + held.get(gid)!.length;
    const idx = prefsOf(t).indexOf(gid);
    const isFallback = fallbackIds.has(t.id);
    const final = isFallback
      ? `All preferences full, so assigned ${g.name} (most free slots, flagged as fallback).`
      : `Assigned ${g.name} (your choice #${idx + 1}).`;
    return {
      teamId: t.id, teamName: t.name, guideId: gid, guideName: g.name,
      rank: isFallback ? null : idx + 1, source: isFallback ? "fallback" : "preference",
      reason: [...trace.get(t.id)!, final, `Load after allocation: ${g.name} ${load}/${g.capacity}`].join("\n"),
    };
  });
}