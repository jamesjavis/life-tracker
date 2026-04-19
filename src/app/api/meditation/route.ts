import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const DEFAULT_DATA = { entries: [], goals: { minutes: 15, sessions: 1 }, lastUpdated: null };

// GET /api/meditation - Get all meditation data
export async function GET() {
  const data = (await storage.get("meditation")) ?? DEFAULT_DATA;
  const today = new Date().toISOString().split("T")[0];
  const entries = data.entries || [];
  const last7 = entries.slice(-7);
  const avgMinutes = last7.length > 0 ? Math.round(last7.reduce((s: number, e: any) => s + (e.minutes || 0), 0) / last7.length) : 0;
  const avgSessions = last7.length > 0 ? Math.round(last7.reduce((s: number, e: any) => s + (e.sessions || 0), 0) / last7.length * 10) / 10 : 0;

  let streak = 0;
  const sortedEntries = [...entries].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const e of sortedEntries) {
    const metGoal = (e.minutes || 0) >= (data.goals?.minutes || 15) && (e.sessions || 0) >= (data.goals?.sessions || 1);
    if (metGoal) streak++;
    else break;
  }
  const todayEntry = entries.find((e: any) => e.date === today);

  return NextResponse.json({
    entries,
    today: todayEntry || null,
    stats: {
      avgMinutes,
      avgSessions,
      streak,
      totalMinutes: entries.reduce((s: number, e: any) => s + (e.minutes || 0), 0),
      totalSessions: entries.reduce((s: number, e: any) => s + (e.sessions || 0), 0)
    },
    goals: data.goals || { minutes: 15, sessions: 1 },
    lastUpdated: data.lastUpdated
  });
}

// POST /api/meditation - Log meditation session
export async function POST(req: Request) {
  const body = await req.json();
  const data = (await storage.get("meditation")) ?? DEFAULT_DATA;
  const today = new Date().toISOString().split("T")[0];

  if (body.action === "log") {
    const dateStr = body.date || today;
    const entry = {
      date: dateStr,
      minutes: Number(body.minutes) || 10,
      sessions: Number(body.sessions) || 1,
      type: body.type || "mindfulness",
      note: body.note || "",
      createdAt: new Date().toISOString()
    };
    const existingIdx = data.entries.findIndex((e: any) => e.date === dateStr);
    if (existingIdx >= 0) {
      data.entries[existingIdx].minutes += entry.minutes;
      data.entries[existingIdx].sessions += entry.sessions;
      if (body.note) data.entries[existingIdx].note = (data.entries[existingIdx].note || "") + " | " + body.note;
    } else {
      data.entries.push(entry);
      data.entries.sort((a: any, b: any) => b.date.localeCompare(a.date));
    }
    await storage.set("meditation", data);
    const updated = data.entries.find((e: any) => e.date === dateStr);
    return NextResponse.json({ success: true, entry: updated });
  }

  if (body.action === "setGoals") {
    if (data.goals) {
      if (body.minutes !== undefined) data.goals.minutes = body.minutes;
      if (body.sessions !== undefined) data.goals.sessions = body.sessions;
    } else {
      data.goals = { minutes: body.minutes ?? 15, sessions: body.sessions ?? 1 };
    }
    await storage.set("meditation", data);
    return NextResponse.json({ success: true, goals: data.goals });
  }

  if (body.action === "delete") {
    const dateStr = body.date || today;
    data.entries = data.entries.filter((e: any) => e.date !== dateStr);
    await storage.set("meditation", data);
    return NextResponse.json({ success: true, entries: data.entries });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
