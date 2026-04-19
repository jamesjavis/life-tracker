import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const DEFAULT_DATA = { meditation: { entries: [], goals: { minutes: 15, sessions: 1 } }, screenTime: { entries: [], dailyLimit: 120 }, lastUpdated: null };

export async function GET() {
  const data = (await storage.get("wellness")) ?? DEFAULT_DATA;
  const today = new Date().toISOString().split("T")[0];
  const medEntries = data.meditation?.entries || [];
  const last7Med = medEntries.slice(-7);
  const avgMinutes = last7Med.length > 0 ? Math.round(last7Med.reduce((s: number, e: any) => s + (e.minutes || 0), 0) / last7Med.length) : 0;
  const avgSessions = last7Med.length > 0 ? Math.round(last7Med.reduce((s: number, e: any) => s + (e.sessions || 0), 0) / last7Med.length * 10) / 10 : 0;
  let medStreak = 0;
  const sortedMed = [...medEntries].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const e of sortedMed) { if ((e.minutes || 0) >= (data.meditation?.goals?.minutes || 15)) medStreak++; else break; }
  const stEntries = data.screenTime?.entries || [];
  const todayST = stEntries.find((e: any) => e.date === today);
  const last7ST = stEntries.slice(-7);
  const avgScreen = last7ST.length > 0 ? Math.round(last7ST.reduce((s: number, e: any) => s + (e.minutes || 0), 0) / last7ST.length) : 0;
  let stStreak = 0;
  const sortedST = [...stEntries].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const e of sortedST) { const limit = data.screenTime?.dailyLimit || 120; if ((e.minutes || 0) <= limit) stStreak++; else break; }
  const todayMed = medEntries.find((e: any) => e.date === today);
  const todaySTVal = todayST?.minutes || 0;
  const limit = data.screenTime?.dailyLimit || 120;
  return NextResponse.json({ meditation: { entries: medEntries, stats: { avgMinutes, avgSessions, streak: medStreak, totalMinutes: medEntries.reduce((s: number, e: any) => s + (e.minutes || 0), 0), totalSessions: medEntries.reduce((s: number, e: any) => s + (e.sessions || 0), 0) }, goals: data.meditation?.goals || { minutes: 15, sessions: 1 }, today: todayMed || null }, screenTime: { entries: stEntries, stats: { avgDaily: avgScreen, streak: stStreak, overLimitDays: stEntries.filter((e: any) => (e.minutes || 0) > (data.screenTime?.dailyLimit || 120)).length }, dailyLimit: data.screenTime?.dailyLimit || 120, todayMinutes: todaySTVal, todayProgress: Math.round((todaySTVal / limit) * 100) } });
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = (await storage.get("wellness")) ?? DEFAULT_DATA;
  const today = new Date().toISOString().split("T")[0];
  if (body.action === "logMeditation") {
    if (!data.meditation) data.meditation = { entries: [], goals: { minutes: 15, sessions: 1 } };
    const entry = { date: today, minutes: Number(body.minutes) || body.duration || 10, sessions: Number(body.sessions) || 1, type: body.type || "mindfulness", note: body.note || "", createdAt: new Date().toISOString() };
    const existingIdx = data.meditation.entries.findIndex((e: any) => e.date === today);
    if (existingIdx >= 0) { data.meditation.entries[existingIdx].minutes += entry.minutes; data.meditation.entries[existingIdx].sessions += entry.sessions; if (body.note) data.meditation.entries[existingIdx].note += " | " + body.note; }
    else { data.meditation.entries.push(entry); data.meditation.entries.sort((a: any, b: any) => b.date.localeCompare(a.date)); }
    await storage.set("wellness", data);
    return NextResponse.json({ success: true, entry: data.meditation.entries.find((e: any) => e.date === today) });
  }
  if (body.action === "updateMedGoals") {
    if (!data.meditation) data.meditation = { entries: [], goals: { minutes: 15, sessions: 1 } };
    if (body.minutes !== undefined) data.meditation.goals.minutes = body.minutes;
    if (body.sessions !== undefined) data.meditation.goals.sessions = body.sessions;
    await storage.set("wellness", data);
    return NextResponse.json({ success: true, goals: data.meditation.goals });
  }
  if (body.action === "logScreenTime") {
    if (!data.screenTime) data.screenTime = { entries: [], dailyLimit: 120 };
    const existingIdx = data.screenTime.entries.findIndex((e: any) => e.date === today);
    if (existingIdx >= 0) data.screenTime.entries[existingIdx].minutes = Number(body.minutes) || 0;
    else data.screenTime.entries.push({ date: today, minutes: Number(body.minutes) || 0 });
    await storage.set("wellness", data);
    return NextResponse.json({ success: true });
  }
  if (body.action === "setScreenLimit") {
    if (!data.screenTime) data.screenTime = { entries: [], dailyLimit: 120 };
    data.screenTime.dailyLimit = body.limit || 120;
    await storage.set("wellness", data);
    return NextResponse.json({ success: true, dailyLimit: data.screenTime.dailyLimit });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
