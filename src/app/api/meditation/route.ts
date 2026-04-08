import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "meditation.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {
      entries: [],
      goals: { minutes: 15, sessions: 1 },
      lastUpdated: null
    };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  ensureDataDir();
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/meditation - Get all meditation data
export async function GET() {
  const data = readData();
  const today = new Date().toISOString().split("T")[0];

  const entries = data.entries || [];
  const last7 = entries.slice(-7);

  // Stats
  const avgMinutes = last7.length > 0
    ? Math.round(last7.reduce((s: number, e: any) => s + (e.minutes || 0), 0) / last7.length)
    : 0;
  const avgSessions = last7.length > 0
    ? Math.round(last7.reduce((s: number, e: any) => s + (e.sessions || 0), 0) / last7.length * 10) / 10
    : 0;

  // Streak (consecutive days meeting goal)
  let streak = 0;
  const sortedEntries = [...entries].sort((a: any, b: any) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
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
  const data = readData();
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

    // Update or add
    const existingIdx = data.entries.findIndex((e: any) => e.date === dateStr);
    if (existingIdx >= 0) {
      data.entries[existingIdx].minutes += entry.minutes;
      data.entries[existingIdx].sessions += entry.sessions;
      if (body.note) {
        data.entries[existingIdx].note = (data.entries[existingIdx].note || "") + " | " + body.note;
      }
    } else {
      data.entries.push(entry);
      data.entries.sort((a: any, b: any) => b.date.localeCompare(a.date));
    }

    writeData(data);
    const updated = data.entries.find((e: any) => e.date === dateStr);
    return NextResponse.json({ success: true, entry: updated });
  }

  if (body.action === "setGoals") {
    if (body.minutes !== undefined) data.goals = data.goals || {};
    if (data.goals) data.goals.minutes = body.minutes;
    if (body.sessions !== undefined) {
      if (!data.goals) data.goals = { minutes: 15, sessions: 1 };
      data.goals.sessions = body.sessions;
    }
    writeData(data);
    return NextResponse.json({ success: true, goals: data.goals });
  }

  if (body.action === "delete") {
    const dateStr = body.date || today;
    data.entries = data.entries.filter((e: any) => e.date !== dateStr);
    writeData(data);
    return NextResponse.json({ success: true, entries: data.entries });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}