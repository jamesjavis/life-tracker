import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const DEFAULT_DATA = { supplements: [], log: [], lastUpdated: null };

function getStreak(entries: any[], supplementId: string) {
  // Support both formats: legacy log [{date, supplementId}] and new entries [{date, taken:[ids]}]  
  const dates = entries
    .filter(e => {
      if (e.supplementId) return e.supplementId === supplementId; // legacy log format
      if (e.taken) return e.taken.includes(supplementId);          // new entries format
      return false;
    })
    .map(e => e.date)
    .filter(Boolean);
  const uniqueDates = [...new Set(dates)].sort().reverse();
  if (uniqueDates.length === 0) return 0;
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  let checkDate = uniqueDates.includes(today) ? today : (uniqueDates.includes(yesterday) ? yesterday : null);
  if (!checkDate) return 0;
  for (const d of uniqueDates) {
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

  // Support both formats: legacy log [{date, supplementId}] and new entries [{date, taken:[ids]}]
  const legacyLog: any[] = data.log || [];
  const newEntries: any[] = data.entries || [];

  // todayTaken from legacy log
  const todayLog = legacyLog.filter((e: any) => e.date === today);
  const todayTakenFromLog = new Set(todayLog.map((e: any) => e.supplementId));
  // todayTaken from new entries
  const todayEntry = newEntries.find((e: any) => e.date === today);
  const todayTakenFromEntries = new Set(todayEntry?.taken || []);
  // Merge both
  const todayTaken = new Set([...todayTakenFromLog, ...todayTakenFromEntries]);

  // All entries merged for streak calculation
  const allEntries = [
    ...legacyLog,
    ...newEntries,
  ];

  const supplementsWithStats = data.supplements.map((s: any) => {
    const sLog = legacyLog.filter((e: any) => e.supplementId === s.id);
    const last7 = sLog.filter((e: any) => {
      const d = new Date(e.date);
      const now = new Date();
      const diff = (now.getTime() - d.getTime()) / 86400000;
      return diff <= 7;
    });
    // last7 from new entries format
    const last7FromEntries = newEntries.filter((e: any) => {
      const d = new Date(e.date);
      return (d.getTime() - Date.now()) >= -7 * 86400000 && e.taken?.includes(s.id);
    });
    const last7Count = last7.length + last7FromEntries.length;
    return {
      ...s,
      taken: todayTaken.has(s.id),
      streak: getStreak(allEntries, s.id),
      last7Days: last7Count,
      totalTaken: sLog.length + newEntries.filter((e: any) => e.taken?.includes(s.id)).length,
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
    // Update legacy log format
    const existingIdx = data.log.findIndex((e: any) => e.date === today && e.supplementId === supplementId);
    if (existingIdx >= 0) {
      data.log.splice(existingIdx, 1);
    } else {
      data.log.push({ date: today, supplementId, timestamp: new Date().toISOString() });
    }
    // Also update new entries format if it exists
    if (data.entries) {
      const entryIdx = data.entries.findIndex((e: any) => e.date === today);
      if (existingIdx >= 0) {
        // untoggle: remove from today's entry
        if (entryIdx >= 0) {
          data.entries[entryIdx].taken = data.entries[entryIdx].taken.filter((id: string) => id !== supplementId);
        }
      } else {
        // toggle on: add to today's entry
        if (entryIdx >= 0) {
          if (!data.entries[entryIdx].taken.includes(supplementId)) {
            data.entries[entryIdx].taken.push(supplementId);
          }
        } else {
          data.entries.push({ date: today, taken: [supplementId] });
        }
      }
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
