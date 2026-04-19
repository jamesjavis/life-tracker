import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  const data = (await storage.get("supplements")) ?? { supplements: [], log: [] };
  const supplements = data.supplements || [];
  const log: any[] = data.log || [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];
  const allDates = [...new Set(log.map((e: any) => e.date))].sort().reverse();
  const lastEntryDate = allDates[0] || null;
  const gapDays = lastEntryDate ? Math.round((today.getTime() - new Date(lastEntryDate + "T00:00:00").getTime()) / 86400000) : null;
  const last7Days: string[] = [];
  for (let i = 0; i < 7; i++) { const d = new Date(today.getTime() - i * 86400000); last7Days.push(d.toISOString().split("T")[0]); }
  const last7Compliance = last7Days.map(date => ({ date, takenCount: log.filter((e: any) => e.date === date).length, total: supplements.length, fullCompliance: log.filter((e: any) => e.date === date).length >= supplements.length }));
  const daysWithAllTaken = last7Compliance.filter((d: any) => d.fullCompliance).length;
  const complianceRate = supplements.length > 0 ? Math.round((daysWithAllTaken / 7) * 100) : 0;
  const supplementStats = supplements.map((s: any) => {
    const sLog = log.filter((e: any) => e.supplementId === s.id);
    const sDates = [...new Set(sLog.map((e: any) => e.date))].sort().reverse();
    const lastDate = sDates[0] || null;
    const gap = lastDate ? Math.round((today.getTime() - new Date(lastDate + "T00:00:00").getTime()) / 86400000) : null;
    let streak = 0;
    const yesterday = new Date(today.getTime() - 86400000).toISOString().split("T")[0];
    const startDate = sDates.includes(todayStr) ? todayStr : (sDates.includes(yesterday) ? yesterday : null);
    if (startDate) {
      let current: string | null = startDate;
      for (const d of sDates) {
        if (d === current) { streak++; current = new Date(new Date(d).getTime() - 86400000).toISOString().split("T")[0]; }
        else break;
      }
    }
    return { id: s.id, name: s.name, emoji: s.emoji, dose: s.dose, lastDate, gapDays: gap, streak, takenToday: sDates[0] === todayStr, last7Taken: sLog.filter((e: any) => last7Days.includes(e.date)).length };
  });
  const status = gapDays === null ? "no_data" : gapDays === 0 ? "logged_today" : gapDays === 1 ? "yesterday" : gapDays <= 3 ? "recent" : gapDays <= 7 ? "stale" : "comeback_needed";
  const motivation = gapDays === null ? "No supplement data yet — tracking ensures consistency." : gapDays === 0 ? "✅ Supplements logged today — consistency is how results happen." : gapDays === 1 ? `💊 Letztes Mal gestern — heute noch loggen! ${supplements.length} Supplements stehen bereit.` : gapDays <= 3 ? `📅 ${gapDays} Tage Lücke — dei Körper merkt sich's. Zurück zur Routine!` : gapDays <= 7 ? `⚠️ ${gapDays} Tage ohne Supplement-Log. Kleine Lücken werden zu grossen.` : `🚨 ${gapDays} Tage ohne Tracking! Deine Supplements verdienen Aufmerksamkeit.`;
  const comebackPlan = gapDays !== null && gapDays >= 2 ? { phase: gapDays >= 14 ? "restart" : "rebuild", focus: gapDays >= 14 ? "Supplements neu starten — 7 Tage am Stück loggen baut die Routine wieder auf." : "Heute wieder einsteigen — jeder Tag zählt für die Streak!", tip: supplements.length > 0 ? `${supplements.length} Supplements konfiguriert. Eingenommen = geloggt (Toggle im Tracker).` : "Füge Supplements im Tracker hinzu: Creatin, Vitamin D, Omega-3..." } : null;
  return NextResponse.json({ lastEntry: lastEntryDate, gapDays, takenToday: supplementStats.filter((s: any) => s.takenToday).length, total: supplements.length, complianceRate, last7Compliance, supplementStats, motivation, comebackPlan, status });
}
