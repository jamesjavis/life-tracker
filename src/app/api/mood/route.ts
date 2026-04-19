import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const DEFAULT_DATA = { entries: [], goals: { energy: 7, mood: 7 }, streaks: { energy: 0, mood: 0 } };

// GET /api/mood - Get mood/energy entries
export async function GET() {
  const data = (await storage.get("mood")) ?? DEFAULT_DATA;
  const entries = data.entries || [];
  const last7 = entries.slice(-7);

  let avgEnergy = 0, avgMood = 0;
  if (last7.length > 0) {
    avgEnergy = Math.round(last7.reduce((s: number, e: any) => s + (e.energy || 0), 0) / last7.length * 10) / 10;
    avgMood = Math.round(last7.reduce((s: number, e: any) => s + (e.mood || 0), 0) / last7.length * 10) / 10;
  }

  let energyStreak = 0, moodStreak = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if ((entries[i].energy || 0) >= (data.goals?.energy || 7)) energyStreak++;
    else break;
  }
  for (let i = entries.length - 1; i >= 0; i--) {
    if ((entries[i].mood || 0) >= (data.goals?.mood || 7)) moodStreak++;
    else break;
  }

  return NextResponse.json({
    entries,
    stats: { avgEnergy, avgMood, last7: last7.length, energyStreak, moodStreak },
    goals: data.goals || { energy: 7, mood: 7 },
    today: entries[entries.length - 1]?.date === new Date().toISOString().split("T")[0] ? entries[entries.length - 1] : null
  });
}

// POST /api/mood - Log mood/energy
export async function POST(req: Request) {
  const { action, energy, mood, note, date } = await req.json();
  const data = (await storage.get("mood")) ?? DEFAULT_DATA;
  const dateStr = date || new Date().toISOString().split("T")[0];

  if (action === "log") {
    const entry = {
      date: dateStr,
      energy: energy || 5,
      mood: mood || 5,
      note: note || "",
      createdAt: new Date().toISOString()
    };
    const existingIndex = data.entries.findIndex((e: any) => e.date === dateStr);
    if (existingIndex >= 0) {
      data.entries[existingIndex] = entry;
    } else {
      data.entries.push(entry);
    }
    data.entries.sort((a: any, b: any) => b.date.localeCompare(a.date));
    await storage.set("mood", data);
    return NextResponse.json({ success: true, entry, entries: data.entries });
  }

  if (action === "delete") {
    data.entries = data.entries.filter((e: any) => e.date !== dateStr);
    await storage.set("mood", data);
    return NextResponse.json({ success: true, entries: data.entries });
  }

  if (action === "updateGoals") {
    if (energy !== undefined) data.goals = { ...data.goals, energy };
    if (mood !== undefined) data.goals = { ...data.goals, mood };
    await storage.set("mood", data);
    return NextResponse.json({ success: true, goals: data.goals });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
