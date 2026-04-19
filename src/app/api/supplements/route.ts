import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const DEFAULT_DATA = { supplements: [], log: [], lastUpdated: null };

function getStreak(log: any[], supplementId: string) {
  const dates = [...new Set(log.filter((e: any) => e.supplementId === supplementId).map((e: any) => e.date))].sort().reverse();
  if (dates.length === 0) return 0;
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  let checkDate = dates.includes(today) ? today : (dates.includes(yesterday) ? yesterday : null);
  if (!checkDate) return 0;
  for (const d of dates) {
    if (d === checkDate) {
      streak++;
      const prevDate: string = new Date(new Date(checkDate).getTime() - 86400000).toISOString().split("T")[0];
      checkDate = prevDate;
    } else break;
  }
  return streak;
}

// GET /api/supplements
export async function GET() {
  const data = (await storage.get("supplements")) ?? DEFAULT_DATA;
  const today = new Date().toISOString().split("T")[0];
  const todayLog = data.log.filter((e: any) => e.date === today);
  const todayTaken = new Set(todayLog.map((e: any) => e.supplementId));

  const supplementsWithStats = data.supplements.map((s: any) => {
    const sLog = data.log.filter((e: any) => e.supplementId === s.id);
    const last7 = sLog.filter((e: any) => {
      const d = new Date(e.date);
      const now = new Date();
      const diff = (now.getTime() - d.getTime()) / 86400000;
      return diff <= 7;
    });
    return {
      ...s,
      taken: todayTaken.has(s.id),
      streak: getStreak(data.log, s.id),
      last7Days: last7.length,
      totalTaken: sLog.length,
    };
  });

  return NextResponse.json({
    supplements: supplementsWithStats,
    todayLog,
    takenToday: todayTaken.size,
    total: data.supplements.length,
  });
}

// POST /api/supplements
export async function POST(req: Request) {
  const body = await req.json();
  const data = (await storage.get("supplements")) ?? DEFAULT_DATA;
  const today = new Date().toISOString().split("T")[0];

  if (body.action === "take") {
    const { supplementId } = body;
    const existingIdx = data.log.findIndex((e: any) => e.date === today && e.supplementId === supplementId);
    if (existingIdx >= 0) {
      data.log.splice(existingIdx, 1);
    } else {
      data.log.push({ date: today, supplementId, timestamp: new Date().toISOString() });
    }
    await storage.set("supplements", data);
    return NextResponse.json({ success: true });
  }

  if (body.action === "add") {
    const { name, emoji, dose, frequency, notes } = body;
    const id = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (data.supplements.find((s: any) => s.id === id)) {
      return NextResponse.json({ error: "Supplement already exists" }, { status: 400 });
    }
    data.supplements.push({ id, name, emoji, dose, frequency, notes });
    await storage.set("supplements", data);
    return NextResponse.json({ success: true, supplement: data.supplements.find((s: any) => s.id) });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
