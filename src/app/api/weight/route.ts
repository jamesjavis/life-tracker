import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { berlinDateStr } from "@/lib/date";

const DEFAULT_DATA = { entries: [], goal: 75.0, lastUpdated: null };

// GET /api/weight - Get weight data
export async function GET() {
  const data = (await storage.get("weight")) ?? DEFAULT_DATA;
  const recent = data.entries.slice(-7);
  const trend = recent.length >= 2
    ? parseFloat((recent[recent.length - 1].weight - recent[0].weight).toFixed(1))
    : 0;
  const lastEntry = data.entries[data.entries.length - 1];
  let bmi = null;
  if (lastEntry) {
    const heightM = 1.78;
    bmi = parseFloat((lastEntry.weight / (heightM * heightM)).toFixed(1));
  }
  return NextResponse.json({ entries: data.entries, goal: data.goal, trend, bmi, lastEntry, lastUpdated: data.lastUpdated });
}

// POST /api/weight - Log new weight
export async function POST(req: Request) {
  const body = await req.json();
  const data = (await storage.get("weight")) ?? DEFAULT_DATA;

  if (body.action === "log") {
    const dateStr = body.date || berlinDateStr();
    data.entries = data.entries.filter((e: any) => e.date !== dateStr);
    data.entries.push({ date: dateStr, weight: body.weight, notes: body.notes || "", createdAt: new Date().toISOString() });
    if (data.entries.length > 365) data.entries = data.entries.slice(-365);
    await storage.set("weight", data);
    const recent = data.entries.slice(-7);
    const trend = recent.length >= 2 ? parseFloat((recent[recent.length - 1].weight - recent[0].weight).toFixed(1)) : 0;
    return NextResponse.json({ success: true, entries: data.entries, trend, goal: data.goal });
  }

  if (body.action === "setGoal") {
    data.goal = body.goal;
    await storage.set("weight", data);
    return NextResponse.json({ success: true, goal: data.goal });
  }

  return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
}
