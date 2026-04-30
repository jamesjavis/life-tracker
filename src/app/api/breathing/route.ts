import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { berlinDateStr } from "@/lib/date";

const DEFAULT_DATA = { sessions: [], lastUpdated: null };

export async function GET() {
  const data = (await storage.get("breathing")) ?? DEFAULT_DATA;
  const today = berlinDateStr();
  const sessions = data.sessions || [];
  const last7 = sessions.slice(-7);
  const todaySessions = sessions.filter((s: any) => s.date === today);
  const totalMinutes = Math.round(sessions.reduce((s: number, x: any) => s + (x.duration || 0), 0) / 60);
  const totalSessions = sessions.length;
  const avgDuration = last7.length > 0 ? Math.round(last7.reduce((s: number, x: any) => s + (x.duration || 0), 0) / last7.length) : 0;

  let streak = 0;
  const sorted = [...sessions].sort((a: any, b: any) => b.date.localeCompare(a.date));
  const uniqueDates = [...new Set(sorted.map((s: any) => s.date))];
  for (let i = 0; i < uniqueDates.length; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const check = d.toISOString().split("T")[0];
    if (uniqueDates.includes(check)) streak++;
    else break;
  }

  return NextResponse.json({
    sessions,
    today: todaySessions.length > 0 ? todaySessions : null,
    stats: { totalSessions, totalMinutes, avgDuration, streak, last7Count: last7.length, todayCount: todaySessions.length }
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = (await storage.get("breathing")) ?? DEFAULT_DATA;
  const today = berlinDateStr();

  if (body.action === "log") {
    const entry = {
      date: today,
      pattern: body.pattern || "box",
      duration: Number(body.duration) || 120,
      rounds: Number(body.rounds) || 0,
      completed: body.completed !== false,
      createdAt: new Date().toISOString()
    };
    data.sessions.push(entry);
    data.sessions.sort((a: any, b: any) => b.date.localeCompare(a.date));
    await storage.set("breathing", data);
    return NextResponse.json({ success: true, entry });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
