import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "wellness.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {
      meditation: { entries: [], goals: { minutes: 15, sessions: 1 } },
      screenTime: { entries: [], dailyLimit: 120 }, // minutes
      lastUpdated: new Date().toISOString()
    };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  ensureDataDir();
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/wellness - Get all wellness data
export async function GET() {
  const data = readData();
  const today = new Date().toISOString().split("T")[0];

  // Meditation stats
  const medEntries = data.meditation?.entries || [];
  const last7Med = medEntries.slice(-7);
  const avgMinutes = last7Med.length > 0
    ? Math.round(last7Med.reduce((s: number, e: any) => s + (e.minutes || 0), 0) / last7Med.length)
    : 0;
  const avgSessions = last7Med.length > 0
    ? Math.round(last7Med.reduce((s: number, e: any) => s + (e.sessions || 0), 0) / last7Med.length * 10) / 10
    : 0;

  // Meditation streak
  let medStreak = 0;
  const sortedMed = [...medEntries].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const e of sortedMed) {
    if ((e.minutes || 0) >= (data.meditation?.goals?.minutes || 15)) medStreak++;
    else break;
  }

  // Screen time stats
  const stEntries = data.screenTime?.entries || [];
  const todayST = stEntries.find((e: any) => e.date === today);
  const last7ST = stEntries.slice(-7);
  const avgScreen = last7ST.length > 0
    ? Math.round(last7ST.reduce((s: number, e: any) => s + (e.minutes || 0), 0) / last7ST.length)
    : 0;

  // Screen time streak (days under limit)
  let stStreak = 0;
  const sortedST = [...stEntries].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const e of sortedST) {
    const limit = data.screenTime?.dailyLimit || 120;
    if ((e.minutes || 0) <= limit) stStreak++;
    else break;
  }

  // Today entries
  const todayMed = medEntries.find((e: any) => e.date === today);
  const todaySTVal = todayST?.minutes || 0;
  const limit = data.screenTime?.dailyLimit || 120;

  return NextResponse.json({
    meditation: {
      entries: medEntries,
      stats: {
        avgMinutes,
        avgSessions,
        streak: medStreak,
        totalMinutes: medEntries.reduce((s: number, e: any) => s + (e.minutes || 0), 0),
        totalSessions: medEntries.reduce((s: number, e: any) => s + (e.sessions || 0), 0)
      },
      goals: data.meditation?.goals || { minutes: 15, sessions: 1 },
      today: todayMed || null
    },
    screenTime: {
      entries: stEntries,
      stats: {
        avgDaily: avgScreen,
        streak: stStreak,
        overLimitDays: stEntries.filter((e: any) => (e.minutes || 0) > (data.screenTime?.dailyLimit || 120)).length
      },
      dailyLimit: data.screenTime?.dailyLimit || 120,
      todayMinutes: todaySTVal,
      todayProgress: Math.round((todaySTVal / limit) * 100)
    }
  });
}

// POST /api/wellness
export async function POST(req: Request) {
  const body = await req.json();
  const data = readData();
  const today = new Date().toISOString().split("T")[0];

  // --- Meditation ---
  if (body.action === "logMeditation") {
    if (!data.meditation) data.meditation = { entries: [], goals: { minutes: 15, sessions: 1 } };
    
    const entry = {
      date: today,
      minutes: Number(body.minutes) || body.duration || 10,
      sessions: Number(body.sessions) || 1,
      type: body.type || "mindfulness",
      note: body.note || "",
      createdAt: new Date().toISOString()
    };

    // Replace or add
    const existingIdx = data.meditation.entries.findIndex((e: any) => e.date === today);
    if (existingIdx >= 0) {
      // Add to existing sessions/minutes
      data.meditation.entries[existingIdx].minutes += entry.minutes;
      data.meditation.entries[existingIdx].sessions += entry.sessions;
      if (body.note) data.meditation.entries[existingIdx].note += " | " + body.note;
    } else {
      data.meditation.entries.push(entry);
      data.meditation.entries.sort((a: any, b: any) => b.date.localeCompare(a.date));
    }
    writeData(data);
    return NextResponse.json({ success: true, entry: data.meditation.entries.find((e: any) => e.date === today) });
  }

  if (body.action === "updateMedGoals") {
    if (!data.meditation) data.meditation = { entries: [], goals: { minutes: 15, sessions: 1 } };
    if (body.minutes !== undefined) data.meditation.goals.minutes = body.minutes;
    if (body.sessions !== undefined) data.meditation.goals.sessions = body.sessions;
    writeData(data);
    return NextResponse.json({ success: true, goals: data.meditation.goals });
  }

  // --- Screen Time ---
  if (body.action === "logScreenTime") {
    if (!data.screenTime) data.screenTime = { entries: [], dailyLimit: 120 };
    
    const minutes = Number(body.minutes) || 0;
    const existingIdx = data.screenTime.entries.findIndex((e: any) => e.date === today);
    
    if (existingIdx >= 0) {
      data.screenTime.entries[existingIdx].minutes += minutes;
      data.screenTime.entries[existingIdx].lastUpdated = new Date().toISOString();
    } else {
      data.screenTime.entries.push({
        date: today,
        minutes,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      data.screenTime.entries.sort((a: any, b: any) => b.date.localeCompare(a.date));
    }
    writeData(data);
    return NextResponse.json({ success: true, todayMinutes: data.screenTime.entries.find((e: any) => e.date === today)?.minutes });
  }

  if (body.action === "setScreenLimit") {
    if (!data.screenTime) data.screenTime = { entries: [], dailyLimit: 120 };
    data.screenTime.dailyLimit = Number(body.limit) || 120;
    writeData(data);
    return NextResponse.json({ success: true, dailyLimit: data.screenTime.dailyLimit });
  }

  if (body.action === "setScreenMinutes") {
    // Set absolute value (for manual entry or morning log)
    if (!data.screenTime) data.screenTime = { entries: [], dailyLimit: 120 };
    const existingIdx = data.screenTime.entries.findIndex((e: any) => e.date === today);
    if (existingIdx >= 0) {
      data.screenTime.entries[existingIdx].minutes = body.minutes;
    } else {
      data.screenTime.entries.push({ date: today, minutes: body.minutes, createdAt: new Date().toISOString() });
      data.screenTime.entries.sort((a: any, b: any) => b.date.localeCompare(a.date));
    }
    writeData(data);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}