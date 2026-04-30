import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { berlinDateStr } from "@/lib/date";

const DEFAULT_DATA = { dailyGoal: 8, entries: [], lastUpdated: null };

export async function GET() {
  const data = (await storage.get("water")) ?? DEFAULT_DATA;
  const today = berlinDateStr();
  const todayEntry = data.entries.find((e: any) => e.date === today);
  const currentGlasses = todayEntry ? todayEntry.glasses : 0;
  const last7 = data.entries.slice(-7);
  const weeklyAvg = last7.length > 0 ? Math.round(last7.reduce((s: number, e: any) => s + e.glasses, 0) / last7.length) : 0;
  let streak = 0;
  const sortedEntries = [...data.entries].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const entry of sortedEntries) { if (entry.glasses >= data.dailyGoal) streak++; else break; }
  const sortedAll = [...data.entries].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastEntry = sortedAll[0]?.date || null;
  const daysSinceLastEntry = lastEntry ? Math.floor((new Date(today).getTime() - new Date(lastEntry).getTime()) / 86400000) : null;
  return NextResponse.json({ dailyGoal: data.dailyGoal, todayGlasses: currentGlasses, todayProgress: Math.round((currentGlasses / data.dailyGoal) * 100), weeklyAvg, streak, lastEntry, daysSinceLastEntry, recentEntries: data.entries.slice(-7).reverse() });
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = (await storage.get("water")) ?? DEFAULT_DATA;
  const today = berlinDateStr();
  if (body.action === "add") {
    const entryIndex = data.entries.findIndex((e: any) => e.date === today);
    if (entryIndex >= 0) data.entries[entryIndex].glasses += 1;
    else { data.entries.push({ date: today, glasses: 1 }); data.entries.sort((a: any, b: any) => a.date.localeCompare(b.date)); }
    await storage.set("water", data);
    const updatedEntry = data.entries.find((e: any) => e.date === today);
    return NextResponse.json({ success: true, glasses: updatedEntry.glasses, dailyGoal: data.dailyGoal });
  }
  if (body.action === "remove") {
    const entryIndex = data.entries.findIndex((e: any) => e.date === today);
    if (entryIndex >= 0 && data.entries[entryIndex].glasses > 0) { data.entries[entryIndex].glasses -= 1; await storage.set("water", data); return NextResponse.json({ success: true, glasses: data.entries[entryIndex].glasses, dailyGoal: data.dailyGoal }); }
    return NextResponse.json({ success: true, glasses: 0, dailyGoal: data.dailyGoal });
  }
  if (body.action === "setGoal") { data.dailyGoal = body.goal || 8; await storage.set("water", data); return NextResponse.json({ success: true, dailyGoal: data.dailyGoal }); }
  if (body.action === "retro") {
    const dateStr = body.date, glasses = typeof body.glasses === "number" ? body.glasses : 0;
    if (!dateStr) return NextResponse.json({ error: "Missing date" }, { status: 400 });
    const entryIndex = data.entries.findIndex((e: any) => e.date === dateStr);
    if (entryIndex >= 0) data.entries[entryIndex].glasses = glasses;
    else { data.entries.push({ date: dateStr, glasses }); data.entries.sort((a: any, b: any) => a.date.localeCompare(b.date)); }
    await storage.set("water", data);
    return NextResponse.json({ success: true, date: dateStr, glasses });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
