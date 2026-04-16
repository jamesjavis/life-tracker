import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "water.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {
      dailyGoal: 8, // glasses
      entries: [],   // { date: "YYYY-MM-DD", glasses: number }
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

// GET /api/water
export async function GET() {
  const data = readData();
  const today = new Date().toISOString().split("T")[0];
  
  // Get today's intake
  const todayEntry = data.entries.find((e: any) => e.date === today);
  const currentGlasses = todayEntry ? todayEntry.glasses : 0;
  
  // Calculate weekly average
  const last7 = data.entries.slice(-7);
  const weeklyAvg = last7.length > 0 
    ? Math.round(last7.reduce((s: number, e: any) => s + e.glasses, 0) / last7.length) 
    : 0;
  
  // Calculate streak (consecutive days hitting goal)
  let streak = 0;
  const sortedEntries = [...data.entries].sort((a: any, b: any) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  for (const entry of sortedEntries) {
    if (entry.glasses >= data.dailyGoal) streak++;
    else break;
  }
  
  // Find last entry date and days since
  const sortedAll = [...data.entries].sort((a: any, b: any) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const lastEntry = sortedAll[0]?.date || null;
  const daysSinceLastEntry = lastEntry
    ? Math.floor((new Date(today).getTime() - new Date(lastEntry).getTime()) / 86400000)
    : null;

  return NextResponse.json({
    dailyGoal: data.dailyGoal,
    todayGlasses: currentGlasses,
    todayProgress: Math.round((currentGlasses / data.dailyGoal) * 100),
    weeklyAvg,
    streak,
    lastEntry,
    daysSinceLastEntry,
    recentEntries: data.entries.slice(-7).reverse()
  });
}

// POST /api/water
export async function POST(req: Request) {
  const body = await req.json();
  const data = readData();
  const today = new Date().toISOString().split("T")[0];

  if (body.action === "add") {
    // Add one glass
    const entryIndex = data.entries.findIndex((e: any) => e.date === today);
    if (entryIndex >= 0) {
      data.entries[entryIndex].glasses += 1;
    } else {
      data.entries.push({ date: today, glasses: 1 });
      data.entries.sort((a: any, b: any) => a.date.localeCompare(b.date));
    }
    writeData(data);
    
    const updatedEntry = data.entries.find((e: any) => e.date === today);
    return NextResponse.json({ success: true, glasses: updatedEntry.glasses, dailyGoal: data.dailyGoal });
  }

  if (body.action === "remove") {
    const entryIndex = data.entries.findIndex((e: any) => e.date === today);
    if (entryIndex >= 0 && data.entries[entryIndex].glasses > 0) {
      data.entries[entryIndex].glasses -= 1;
      writeData(data);
      return NextResponse.json({ success: true, glasses: data.entries[entryIndex].glasses, dailyGoal: data.dailyGoal });
    }
    return NextResponse.json({ success: true, glasses: 0, dailyGoal: data.dailyGoal });
  }

  if (body.action === "setGoal") {
    data.dailyGoal = body.goal || 8;
    writeData(data);
    return NextResponse.json({ success: true, dailyGoal: data.dailyGoal });
  }

  if (body.action === "retro") {
    // Retro-log water for a specific date
    const dateStr = body.date;
    const glasses = typeof body.glasses === "number" ? body.glasses : 0;
    if (!dateStr) return NextResponse.json({ error: "Missing date" }, { status: 400 });
    const entryIndex = data.entries.findIndex((e: any) => e.date === dateStr);
    if (entryIndex >= 0) {
      data.entries[entryIndex].glasses = glasses;
    } else {
      data.entries.push({ date: dateStr, glasses });
      data.entries.sort((a: any, b: any) => a.date.localeCompare(b.date));
    }
    writeData(data);
    return NextResponse.json({ success: true, date: dateStr, glasses });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}