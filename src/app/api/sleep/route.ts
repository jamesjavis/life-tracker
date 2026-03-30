import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "sleep.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return { entries: [] };
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/sleep - Get sleep entries
export async function GET() {
  const data = readData();
  
  // Calculate stats
  const entries = data.entries || [];
  const last7 = entries.slice(-7);
  
  let avgDuration = 0;
  let avgQuality = 0;
  
  if (last7.length > 0) {
    const totalDuration = last7.reduce((sum: number, e: any) => sum + (e.duration || 0), 0);
    const totalQuality = last7.reduce((sum: number, e: any) => sum + (e.quality || 0), 0);
    avgDuration = Math.round(totalDuration / last7.length * 10) / 10;
    avgQuality = Math.round(totalQuality / last7.length * 10) / 10;
  }
  
  // Calculate streak (consecutive days with 7+ hours)
  let streak = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].duration >= 7) {
      streak++;
    } else {
      break;
    }
  }
  
  return NextResponse.json({
    entries,
    stats: { avgDuration, avgQuality, streak, last7: last7.length },
    goal: 8 // hours
  });
}

// POST /api/sleep - Log sleep entry
export async function POST(req: Request) {
  const { action, date, bedtime, wakeup, duration, quality, notes } = await req.json();
  const data = readData();
  
  const dateStr = date || new Date().toISOString().split("T")[0];
  
  if (action === "log") {
    const entry = {
      date: dateStr,
      bedtime: bedtime || null,
      wakeup: wakeup || null,
      duration: duration || 0,
      quality: quality || 5,
      notes: notes || "",
      createdAt: new Date().toISOString()
    };
    
    // Replace existing entry for this date or add new
    const existingIndex = data.entries.findIndex((e: any) => e.date === dateStr);
    if (existingIndex >= 0) {
      data.entries[existingIndex] = entry;
    } else {
      data.entries.push(entry);
    }
    
    // Sort by date descending
    data.entries.sort((a: any, b: any) => b.date.localeCompare(a.date));
    
    writeData(data);
    
    return NextResponse.json({
      success: true,
      entry,
      entries: data.entries
    });
  }
  
  if (action === "delete") {
    data.entries = data.entries.filter((e: any) => e.date !== dateStr);
    writeData(data);
    return NextResponse.json({ success: true, entries: data.entries });
  }
  
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}