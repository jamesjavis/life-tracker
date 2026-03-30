import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "weight.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {
      entries: [],
      goal: 75.0, // kg
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

// GET /api/weight - Get weight data
export async function GET() {
  const data = readData();
  
  // Calculate trend from last 7 entries
  const recent = data.entries.slice(-7);
  const trend = recent.length >= 2 
    ? parseFloat((recent[recent.length - 1].weight - recent[0].weight).toFixed(1))
    : 0;
  
  // Calculate BMI if last entry exists
  const lastEntry = data.entries[data.entries.length - 1];
  let bmi = null;
  if (lastEntry) {
    const heightM = 1.78; // Patrick's height in meters
    bmi = parseFloat((lastEntry.weight / (heightM * heightM)).toFixed(1));
  }

  return NextResponse.json({
    entries: data.entries,
    goal: data.goal,
    trend,
    bmi,
    lastEntry,
    lastUpdated: data.lastUpdated
  });
}

// POST /api/weight - Log new weight
export async function POST(req: Request) {
  const body = await req.json();
  const data = readData();

  if (body.action === "log") {
    const dateStr = body.date || new Date().toISOString().split("T")[0];
    
    // Remove existing entry for same date if any
    data.entries = data.entries.filter((e: any) => e.date !== dateStr);
    
    data.entries.push({
      date: dateStr,
      weight: body.weight,
      notes: body.notes || "",
      createdAt: new Date().toISOString()
    });

    // Keep only last 365 entries
    if (data.entries.length > 365) {
      data.entries = data.entries.slice(-365);
    }

    writeData(data);
    
    // Calculate new trend
    const recent = data.entries.slice(-7);
    const trend = recent.length >= 2 
      ? parseFloat((recent[recent.length - 1].weight - recent[0].weight).toFixed(1))
      : 0;
    
    return NextResponse.json({ success: true, entries: data.entries, trend, goal: data.goal });
  }

  if (body.action === "setGoal") {
    data.goal = body.goal;
    writeData(data);
    return NextResponse.json({ success: true, goal: data.goal });
  }

  return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
}