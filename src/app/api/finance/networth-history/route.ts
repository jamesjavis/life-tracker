import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

function getSnapshotLabel(date: Date): string {
  return date.toLocaleDateString("de-DE", { month: "short", year: "numeric" });
}

// GET /api/finance/networth-history
export async function GET() {
  const rawHistory = await storage.get("networth-history");
  const history: any[] = Array.isArray(rawHistory) ? rawHistory : [];
  const finance = (await storage.get("finance")) ?? {};
  const savings = finance?.savings ?? 2000;
  const crypto = finance?.crypto ?? 10000;
  const monthlyCosts = finance?.monthlyCosts ?? 1000;
  const funding = finance?.funding ?? { status: "pending", amount: 12000, expected: "May/June 2026" };
  const transactions = finance?.transactions ?? [];
  const currentNetWorth = savings + crypto;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const lastEntry = history[history.length - 1];
  const lastEntryMonth = lastEntry?.month ?? null;
  if (lastEntryMonth !== todayKey) {
    const newEntry = { month: todayKey, label: getSnapshotLabel(today), date: today.toISOString().split("T")[0], savings, crypto, netWorth: currentNetWorth };
    const dayOfMonth = today.getDate();
    if (lastEntryMonth !== null || history.length === 0 || dayOfMonth <= 2) {
      const existingIdx = history.findIndex((e: any) => e.month === todayKey);
      if (existingIdx >= 0) history[existingIdx] = newEntry;
      else history.push(newEntry);
      await storage.set("networth-history", history);
    }
  }
  const monthlyNetChange: Record<string, number> = {};
  transactions.forEach((t: any) => { const monthKey = t.date ? t.date.slice(0, 7) : null; if (!monthKey) return; monthlyNetChange[monthKey] = (monthlyNetChange[monthKey] || 0) + (t.type === "income" ? t.amount : -t.amount); });
  const TARGET = 50000;
  const estimatedMonthlyIncome = 3000;
  const monthlySavingsRate = estimatedMonthlyIncome - monthlyCosts;
  let fundingMonth: Date | null = null;
  if (funding.expected?.toLowerCase().includes("june")) fundingMonth = new Date(2026, 5, 1);
  else if (funding.expected) fundingMonth = new Date(2026, 4, 1);
  const projection: any[] = [];
  for (const entry of history) projection.push({ month: entry.month, label: entry.label, netWorth: entry.netWorth, savings: entry.savings, crypto: entry.crypto, isProjection: false, isPostFunding: false, milestone: null });
  let runningSavings = savings, runningCrypto = crypto;
  for (let i = 1; i <= 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = getSnapshotLabel(d);
    let milestone: string | null = null, fundingIncoming = 0;
    if (fundingMonth && d >= fundingMonth && i > 0) { const prev = projection[projection.length - 1]; if (!prev?.isPostFunding) { milestone = `€${(funding.amount || 12000) / 1000}K Grant!`; fundingIncoming = funding.amount || 12000; } }
    if (fundingIncoming > 0) { runningSavings += fundingIncoming * 0.7; runningCrypto += fundingIncoming * 0.3; }
    runningSavings = Math.max(0, runningSavings + monthlySavingsRate);
    projection.push({ month: monthKey, label, netWorth: Math.round(runningSavings + runningCrypto), savings: Math.round(runningSavings), crypto: Math.round(runningCrypto), isProjection: true, isPostFunding: fundingIncoming > 0, milestone });
  }
  const milestones = [{ label: "Emergency Fund", target: 5000, color: "green" }, { label: "€12K Net Worth", target: 12000, color: "blue" }, { label: "€25K Net Worth", target: 25000, color: "purple" }, { label: "€50K FI Target", target: 50000, color: "amber" }].map(m => ({ ...m, reached: projection.some(p => p.netWorth >= m.target && !p.isProjection), projectedMonth: projection.find(p => p.netWorth >= m.target && p.isProjection)?.month ?? null }));
  return NextResponse.json({ history: projection, current: { savings, crypto, netWorth: currentNetWorth, monthlyCosts, monthlySavingsRate, monthlyIncome: estimatedMonthlyIncome, sparquote: Math.round((monthlySavingsRate / estimatedMonthlyIncome) * 100) }, milestones, monthsTo12K: projection.findIndex(p => p.netWorth >= 12000) >= 0 ? projection.findIndex(p => p.netWorth >= 12000) : null, monthsTo25K: projection.findIndex(p => p.netWorth >= 25000) >= 0 ? projection.findIndex(p => p.netWorth >= 25000) : null, monthsTo50K: projection.findIndex(p => p.netWorth >= 50000) >= 0 ? projection.findIndex(p => p.netWorth >= 50000) : null, target: TARGET });
}

// POST /api/finance/networth-history
export async function POST(req: Request) {
  const body = await req.json();
  const rawHistory = await storage.get("networth-history");
  const history: any[] = Array.isArray(rawHistory) ? rawHistory : [];
  const finance = (await storage.get("finance")) ?? {};
  const savings = body.savings ?? finance?.savings ?? 2000;
  const crypto = body.crypto ?? finance?.crypto ?? 10000;
  const today = new Date();
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const entry = { month: monthKey, label: getSnapshotLabel(today), date: today.toISOString().split("T")[0], savings, crypto, netWorth: savings + crypto, note: body.note || null };
  const existingIdx = history.findIndex((e: any) => e.month === monthKey);
  if (existingIdx >= 0) history[existingIdx] = entry;
  else { history.push(entry); history.sort((a: any, b: any) => a.month.localeCompare(b.month)); }
  await storage.set("networth-history", history);
  return NextResponse.json({ success: true, entry, history });
}
