import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "supplements.json");

function readData() {
  if (!fs.existsSync(DATA_FILE)) return { supplements: [], log: [] };
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

export async function GET() {
  const data = readData();
  const supplements = data.supplements || [];
  const log: any[] = data.log || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // All unique log dates sorted descending
  const allDates = [...new Set(log.map((e: any) => e.date))].sort().reverse();

  const lastEntryDate = allDates[0] || null;
  const gapDays = lastEntryDate
    ? Math.round((today.getTime() - new Date(lastEntryDate + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Compliance: last 7 days
  const last7Days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    last7Days.push(d.toISOString().split("T")[0]);
  }
  const last7Compliance = last7Days.map(date => ({
    date,
    takenCount: log.filter((e: any) => e.date === date).length,
    total: supplements.length,
    fullCompliance: log.filter((e: any) => e.date === date).length >= supplements.length,
  }));

  const daysWithAllTaken = last7Compliance.filter(d => d.fullCompliance).length;
  const complianceRate = supplements.length > 0
    ? Math.round((daysWithAllTaken / 7) * 100)
    : 0;

  // Per-supplement streaks
  const supplementStats = supplements.map(s => {
    const sLog = log.filter((e: any) => e.supplementId === s.id);
    const sDates = [...new Set(sLog.map((e: any) => e.date))].sort().reverse();
    const lastDate = sDates[0] || null;
    const gap = lastDate
      ? Math.round((today.getTime() - new Date(lastDate + "T00:00:00").getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Streak: count consecutive days from today/yesterday backwards
    let streak = 0;
    const yesterday = new Date(today.getTime() - 86400000).toISOString().split("T")[0];
    let checkDate = sDates.includes(todayStr) ? todayStr : (sDates.includes(yesterday) ? yesterday : null);
    if (checkDate) {
      for (const d of sDates) {
        if (d === checkDate) {
          streak++;
          const prev = new Date(new Date(checkDate).getTime() - 86400000).toISOString().split("T")[0];
          checkDate = prev;
        } else break;
      }
    }

    const takenToday = sDates[0] === todayStr;

    return {
      id: s.id,
      name: s.name,
      emoji: s.emoji,
      dose: s.dose,
      lastDate,
      gapDays: gap,
      streak,
      takenToday,
      last7Taken: sLog.filter((e: any) => last7Days.includes(e.date)).length,
    };
  });

  const status = gapDays === null
    ? "no_data"
    : gapDays === 0
    ? "logged_today"
    : gapDays === 1
    ? "yesterday"
    : gapDays <= 3
    ? "recent"
    : gapDays <= 7
    ? "stale"
    : "comeback_needed";

  const motivation = (() => {
    if (gapDays === null) return "No supplement data yet — tracking ensures consistency.";
    if (gapDays === 0) return "✅ Supplements logged today — consistency is how results happen.";
    if (gapDays === 1) return `💊 Letztes Mal gestern — heute noch loggen! ${supplements.length} Supplements stehen bereit.`;
    if (gapDays <= 3) return `📅 ${gapDays} Tage Lücke — dei Körper merkt sich's. Zurück zur Routine!`;
    if (gapDays <= 7) return `⚠️ ${gapDays} Tage ohne Supplement-Log. Kleine Lücken werden zu grossen.`;
    return `🚨 ${gapDays} Tage ohne Tracking! Deine Supplements verdienen Aufmerksamkeit.`;
  })();

  const takenTodayCount = supplementStats.filter(s => s.takenToday).length;

  const comebackPlan = gapDays !== null && gapDays >= 2
    ? {
        phase: gapDays >= 14 ? "restart" : "rebuild",
        focus: gapDays >= 14
          ? "Supplements neu starten — 7 Tage am Stück loggen baut die Routine wieder auf."
          : "Heute wieder einsteigen — jeder Tag zählt für die Streak!",
        tip: supplements.length > 0
          ? `${supplements.length} Supplements konfiguriert. Eingenommen = geloggt (Toggle im Tracker).`
          : "Füge Supplements im Tracker hinzu: Creatin, Vitamin D, Omega-3...",
      }
    : null;

  return NextResponse.json({
    lastEntry: lastEntryDate,
    gapDays,
    takenToday: takenTodayCount,
    total: supplements.length,
    complianceRate,
    last7Compliance,
    supplementStats,
    motivation,
    comebackPlan,
    status,
  });
}
