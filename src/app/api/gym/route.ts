import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "gym.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return { logs: [], streak: 0 };
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/gym - Get gym data
export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

// POST /api/gym - Log gym session
export async function POST(req: Request) {
  const { date } = await req.json();
  const data = readData();
  const dateStr = date || new Date().toISOString().split("T")[0];

  // Avoid duplicates
  if (!data.logs.includes(dateStr)) {
    data.logs.push(dateStr);
    data.logs.sort();

    // Update streak
    data.streak = calculateStreak(data.logs);
  }

  writeData(data);
  return NextResponse.json({ success: true, streak: data.streak });
}

function calculateStreak(logs: string[]): number {
  if (!logs.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let currentDate = new Date(today);

  // Check if today or yesterday is in logs (allow for current day not logged yet)
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (!logs.includes(todayStr) && !logs.includes(yesterdayStr)) {
    return 0; // Streak broken
  }

  // Walk backwards from today
  while (logs.includes(currentDate.toISOString().split("T")[0])) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}