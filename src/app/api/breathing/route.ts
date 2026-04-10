import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "breathing.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return { sessions: [], lastUpdated: null };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  ensureDataDir();
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  const data = readData();
  const today = new Date().toISOString().split("T")[0];
  const sessions = data.sessions || [];

  const last7 = sessions.slice(-7);
  const todaySessions = sessions.filter((s: any) => s.date === today);

  const totalMinutes = Math.round(sessions.reduce((s: number, x: any) => s + (x.duration || 0), 0) / 60);
  const totalSessions = sessions.length;
  const avgDuration = last7.length > 0
    ? Math.round(last7.reduce((s: number, x: any) => s + (x.duration || 0), 0) / last7.length)
    : 0;

  // Streak: consecutive days with 1+ sessions
  let streak = 0;
  const sorted = [...sessions].sort((a: any, b: any) => b.date.localeCompare(a.date));
  const uniqueDates = [...new Set(sorted.map((s: any) => s.date))];
  const todayDate = new Date().toISOString().split("T")[0];
  for (let i = 0; i < uniqueDates.length; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const check = d.toISOString().split("T")[0];
    if (uniqueDates.includes(check)) streak++;
    else break;
  }

  return NextResponse.json({
    sessions,
    today: todaySessions.length > 0 ? todaySessions : null,
    stats: {
      totalSessions,
      totalMinutes,
      avgDuration,
      streak,
      last7Count: last7.length,
      todayCount: todaySessions.length
    }
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = readData();
  const today = new Date().toISOString().split("T")[0];

  if (body.action === "log") {
    const entry = {
      date: today,
      pattern: body.pattern || "box",
      duration: Number(body.duration) || 120, // seconds
      rounds: Number(body.rounds) || 0,
      completed: body.completed !== false,
      createdAt: new Date().toISOString()
    };
    data.sessions.push(entry);
    data.sessions.sort((a: any, b: any) => b.date.localeCompare(a.date));
    writeData(data);
    return NextResponse.json({ success: true, entry });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
