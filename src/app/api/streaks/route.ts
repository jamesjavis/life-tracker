import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "streaks.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return { streaks: {} };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/streaks - Get all streaks
export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

// POST /api/streaks - Update a streak
export async function POST(req: Request) {
  const { streakId, date } = await req.json();
  const data = readData();
  const dateStr = date || new Date().toISOString().split("T")[0];

  if (!data.streaks[streakId]) {
    data.streaks[streakId] = { logs: [], currentStreak: 0, bestStreak: 0 };
  }

  if (!data.streaks[streakId].logs.includes(dateStr)) {
    data.streaks[streakId].logs.push(dateStr);
    data.streaks[streakId].logs.sort();
    data.streaks[streakId].currentStreak = calculateStreak(data.streaks[streakId].logs);
    if (data.streaks[streakId].currentStreak > data.streaks[streakId].bestStreak) {
      data.streaks[streakId].bestStreak = data.streaks[streakId].currentStreak;
    }
  }

  writeData(data);
  return NextResponse.json({
    success: true,
    streak: data.streaks[streakId]
  });
}

function calculateStreak(logs: string[]): number {
  if (!logs.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (!logs.includes(todayStr) && !logs.includes(yesterdayStr)) {
    return 0;
  }

  let streak = 0;
  let currentDate = new Date(today);

  while (logs.includes(currentDate.toISOString().split("T")[0])) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}