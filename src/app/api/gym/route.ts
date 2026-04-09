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
  if (!fs.existsSync(DATA_FILE)) {
    return { logs: [], streak: 0, workouts: {} };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function calculateStreak(logs: string[]): number {
  if (!logs.length) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const sorted = [...logs].sort();
  const lastLog = sorted[sorted.length - 1];

  // If streak is broken (last workout more than 1 day ago), return 0
  if (lastLog !== todayStr && lastLog !== yesterdayStr) {
    return 0;
  }

  // Start from most recent log and count backwards through consecutive days
  let streak = 0;
  let currentDate = new Date(lastLog);
  currentDate.setHours(0, 0, 0, 0);

  while (logs.includes(currentDate.toISOString().split("T")[0])) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

// GET /api/gym - Get gym data
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const data = readData();

  // Always recalculate streak dynamically (data.streak in file may be stale)
  data.streak = calculateStreak(data.logs);


  if (date) {
    const workout = data.workouts?.[date];
    return NextResponse.json({ 
      logs: data.logs, 
      streak: data.streak, 
      workout: workout || null 
    });
  }


  return NextResponse.json({ logs: data.logs, streak: data.streak, workouts: data.workouts || {} });
}

// POST /api/gym - Log gym session with optional workout details
export async function POST(req: Request) {
  const body = await req.json();
  const { date, completed, workout } = body;
  const data = readData();
  const dateStr = date || new Date().toISOString().split("T")[0];

  if (completed === false) {
    // Remove the log
    data.logs = data.logs.filter((l: string) => l !== dateStr);
    delete data.workouts?.[dateStr];
    data.streak = calculateStreak(data.logs);
    writeData(data);
    return NextResponse.json({ success: true, streak: data.streak });
  }

  // Add to logs if not already present
  if (!data.logs.includes(dateStr)) {
    data.logs.push(dateStr);
    data.logs.sort();
    data.streak = calculateStreak(data.logs);
  }

  // Store workout details if provided
  if (workout) {
    if (!data.workouts) data.workouts = {};
    data.workouts[dateStr] = {
      ...workout,
      timestamp: new Date().toISOString()
    };
  }

  writeData(data);
  return NextResponse.json({ success: true, streak: data.streak });
}