import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// GET /api/sleep - Get sleep entries
export async function GET() {
  const data = (await storage.get("sleep")) ?? { entries: [] };
  const entries = data.entries || [];
  const last7 = entries.slice(-7);

  let avgDuration = 0, avgQuality = 0;
  if (last7.length > 0) {
    avgDuration = Math.round(last7.reduce((s: number, e: any) => s + (e.duration || 0), 0) / last7.length * 10) / 10;
    avgQuality = Math.round(last7.reduce((s: number, e: any) => s + (e.quality || 0), 0) / last7.length * 10) / 10;
  }

  let streak = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].duration >= 7) streak++;
    else break;
  }

  return NextResponse.json({
    entries,
    stats: { avgDuration, avgQuality, streak, last7: last7.length },
    goal: 8
  });
}

// POST /api/sleep - Log sleep entry
export async function POST(req: Request) {
  const { action, date, bedtime, wakeup, duration, quality, notes } = await req.json();
  const data = (await storage.get("sleep")) ?? { entries: [] };
  const dateStr = date || new Date().toISOString().split("T")[0];

  if (action === "log") {
    const entry = { date: dateStr, bedtime: bedtime || null, wakeup: wakeup || null, duration: duration || 0, quality: quality || 7, notes: notes || "", createdAt: new Date().toISOString() };
    const existingIndex = data.entries.findIndex((e: any) => e.date === dateStr);
    if (existingIndex >= 0) data.entries[existingIndex] = entry;
    else data.entries.push(entry);
    data.entries.sort((a: any, b: any) => b.date.localeCompare(a.date));
    await storage.set("sleep", data);
    return NextResponse.json({ success: true, entry, entries: data.entries });
  }

  if (action === "delete") {
    data.entries = data.entries.filter((e: any) => e.date !== dateStr);
    await storage.set("sleep", data);
    return NextResponse.json({ success: true, entries: data.entries });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
