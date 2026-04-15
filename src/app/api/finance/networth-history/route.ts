import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const HISTORY_FILE = path.join(process.cwd(), "data", "networth-history.json");
const FINANCE_FILE = path.join(process.cwd(), "data", "finance.json");

function ensureDir() {
  const dir = path.dirname(HISTORY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readHistory() {
  ensureDir();
  if (!fs.existsSync(HISTORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf-8"));
}

function writeHistory(data: any[]) {
  ensureDir();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

function readFinance() {
  if (!fs.existsSync(FINANCE_FILE)) return null;
  return JSON.parse(fs.readFileSync(FINANCE_FILE, "utf-8"));
}

function getSnapshotLabel(date: Date): string {
  return date.toLocaleDateString("de-DE", { month: "short", year: "numeric" });
}

// GET /api/finance/networth-history
export async function GET() {
  const history = readHistory();
  const finance = readFinance();

  const savings = finance?.savings ?? 2000;
  const crypto = finance?.crypto ?? 10000;
  const monthlyCosts = finance?.monthlyCosts ?? 1000;
  const funding = finance?.funding ?? { status: "pending", amount: 12000, expected: "May/June 2026" };
  const transactions = finance?.transactions ?? [];

  const currentNetWorth = savings + crypto;

  // Auto-snapshot for current month if not already recorded
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const lastEntry = history[history.length - 1];
  const lastEntryMonth = lastEntry ? lastEntry.month : null;

  if (lastEntryMonth !== todayKey) {
    const newEntry = {
      month: todayKey,
      label: getSnapshotLabel(today),
      date: today.toISOString().split("T")[0],
      savings,
      crypto,
      netWorth: currentNetWorth,
    };
    // Only auto-add if we already have history or it's been > 20 days this month
    const dayOfMonth = today.getDate();
    if (lastEntryMonth !== null || dayOfMonth >= 20) {
      history.push(newEntry);
      writeHistory(history);
    }
  }

  // Compute monthly net worth changes from transactions
  const monthlyNetChange: Record<string, number> = {};
  transactions.forEach((t: any) => {
    const monthKey = t.date ? t.date.slice(0, 7) : null;
    if (!monthKey) return;
    if (!monthlyNetChange[monthKey]) monthlyNetChange[monthKey] = 0;
    monthlyNetChange[monthKey] += t.type === "income" ? t.amount : -t.amount;
  });

  const now = new Date();
  const TARGET = 50000;

  // Conservative estimate: €3K/mo income, net savings after costs
  const estimatedMonthlyIncome = 3000;
  const monthlySavingsRate = estimatedMonthlyIncome - monthlyCosts;

  // Funding month
  let fundingMonth: Date | null = null;
  if (funding.expected) {
    if (funding.expected.toLowerCase().includes("june")) {
      fundingMonth = new Date(2026, 5, 1);
    } else {
      fundingMonth = new Date(2026, 4, 1); // May 2026
    }
  }

  // Build full timeline: historical + future projection
  const projection: {
    month: string;
    label: string;
    netWorth: number;
    savings: number;
    crypto: number;
    isProjection: boolean;
    isPostFunding: boolean;
    milestone: string | null;
  }[] = [];

  let runningSavings = savings;
  let runningCrypto = crypto;

  // Historical entries
  for (const entry of history) {
    projection.push({
      month: entry.month,
      label: entry.label,
      netWorth: entry.netWorth,
      savings: entry.savings,
      crypto: entry.crypto,
      isProjection: false,
      isPostFunding: false,
      milestone: null,
    });
  }

  // Future projections (12 months forward)
  for (let i = 1; i <= 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = getSnapshotLabel(d);

    let milestone: string | null = null;
    let fundingIncoming = 0;

    if (fundingMonth && d >= fundingMonth && i > 0) {
      const prev = projection[projection.length - 1];
      if (!prev?.isPostFunding) {
        milestone = `€${(funding.amount || 12000) / 1000}K Grant!`;
        fundingIncoming = funding.amount || 12000;
      }
    }

    if (fundingIncoming > 0) {
      runningSavings += fundingIncoming * 0.7;
      runningCrypto += fundingIncoming * 0.3;
    }

    runningSavings = Math.max(0, runningSavings + monthlySavingsRate);

    projection.push({
      month: monthKey,
      label,
      netWorth: Math.round(runningSavings + runningCrypto),
      savings: Math.round(runningSavings),
      crypto: Math.round(runningCrypto),
      isProjection: true,
      isPostFunding: fundingIncoming > 0,
      milestone,
    });
  }

  // Milestone markers
  const milestones = [
    { label: "Emergency Fund", target: 5000, color: "green" },
    { label: "€12K Net Worth", target: 12000, color: "blue" },
    { label: "€25K Net Worth", target: 25000, color: "purple" },
    { label: "€50K FI Target", target: 50000, color: "amber" },
  ].map(m => ({
    ...m,
    reached: projection.some(p => p.netWorth >= m.target && !p.isProjection),
    projectedMonth: projection.find(p => p.netWorth >= m.target && p.isProjection)?.month ?? null,
  }));

  const monthsTo12K = projection.findIndex(p => p.netWorth >= 12000);
  const monthsTo25K = projection.findIndex(p => p.netWorth >= 25000);
  const monthsTo50K = projection.findIndex(p => p.netWorth >= 50000);

  return NextResponse.json({
    history: projection,
    current: {
      savings,
      crypto,
      netWorth: currentNetWorth,
      monthlyCosts,
      monthlySavingsRate,
      monthlyIncome: estimatedMonthlyIncome,
      sparquote: Math.round((monthlySavingsRate / estimatedMonthlyIncome) * 100),
    },
    milestones,
    monthsTo12K: monthsTo12K >= 0 ? monthsTo12K : null,
    monthsTo25K: monthsTo25K >= 0 ? monthsTo25K : null,
    monthsTo50K: monthsTo50K >= 0 ? monthsTo50K : null,
    target: TARGET,
  });
}

// POST /api/finance/networth-history — manual snapshot
export async function POST(req: Request) {
  const body = await req.json();
  const history = readHistory();
  const finance = readFinance() || {};

  const savings = body.savings ?? finance.savings ?? 2000;
  const crypto = body.crypto ?? finance.crypto ?? 10000;

  const today = new Date();
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const entry = {
    month: monthKey,
    label: getSnapshotLabel(today),
    date: today.toISOString().split("T")[0],
    savings,
    crypto,
    netWorth: savings + crypto,
    note: body.note || null,
  };

  const existingIdx = history.findIndex((e: any) => e.month === monthKey);
  if (existingIdx >= 0) {
    history[existingIdx] = entry;
  } else {
    history.push(entry);
  }

  history.sort((a: any, b: any) => a.month.localeCompare(b.month));
  writeHistory(history);

  return NextResponse.json({ success: true, entry, history });
}
