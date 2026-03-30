import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "mood.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return { entries: [], goals: { energy: 7, mood: 7 }, streaks: { energy: 0, mood: 0 } };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  ensureDataDir();
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/mood - Get mood/energy entries
export async function GET() {
  const data = readData();
  const entries = data.entries || [];
  const last7 = entries.slice(-7);

  // Calculate averages
  let avgEnergy = 0, avgMood = 0;
  if (last7.length > 0) {
    avgEnergy = Math.round(last7.reduce((s: number, e: any) => s + (e.energy || 0), 0) / last7.length * 10) / 10;
    avgMood = Math.round(last7.reduce((s: number, e: any) => s + (e.mood || 0), 0) / last7.length * 10) / 10;
  }

  // Calculate streaks (days meeting goal)
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
  const data = readData();
  const dateStr = date || new Date().toISOString().split("T")[0];

  if (action === "log") {
    const entry = {
      date: dateStr,
      energy: energy || 5,
      mood: mood || 5,
      note: note || "",
      createdAt: new Date().toISOString()
    };

    // Replace or add entry for this date
    const existingIndex = data.entries.findIndex((e: any) => e.date === dateStr);
    if (existingIndex >= 0) {
      data.entries[existingIndex] = entry;
    } else {
      data.entries.push(entry);
    }

    // Sort by date descending
    data.entries.sort((a: any, b: any) => b.date.localeCompare(a.date));
    writeData(data);

    return NextResponse.json({ success: true, entry, entries: data.entries });
  }

  if (action === "delete") {
    data.entries = data.entries.filter((e: any) => e.date !== dateStr);
    writeData(data);
    return NextResponse.json({ success: true, entries: data.entries });
  }

  if (action === "updateGoals") {
    if (energy !== undefined) data.goals = { ...data.goals, energy };
    if (mood !== undefined) data.goals = { ...data.goals, mood };
    writeData(data);
    return NextResponse.json({ success: true, goals: data.goals });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}