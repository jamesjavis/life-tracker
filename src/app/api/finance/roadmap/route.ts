import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "finance.json");

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    return {
      savings: 2000,
      crypto: 10000,
      monthlyCosts: 1000,
      funding: { status: "pending", amount: 12000, expected: "May/June 2026" },
      transactions: []
    };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

// GET /api/finance/roadmap - FI Roadmap projections
export async function GET() {
  const data = readData();

  const savings = data.savings || 2000;
  const crypto = data.crypto || 10000;
  const monthlyCosts = data.monthlyCosts || 1000;
  const funding = data.funding || { status: "pending", amount: 12000, expected: "May/June 2026" };

  const netWorth = savings + crypto;
  const TARGET = 50000;

  // Estimate monthly income from transactions (if any logged)
  const transactions = data.transactions || [];
  const thisMonth = new Date();
  const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1).toISOString().split("T")[0];
  const thisMonthTx = transactions.filter((t: any) => t.date >= monthStart);
  const monthlyIncome = thisMonthTx
    .filter((t: any) => t.type === "income")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  // Use €3K/month as conservative estimate if no transactions logged
  const estimatedMonthlyIncome = monthlyIncome > 0 ? monthlyIncome : 3000;
  const monthlySavingsRate = estimatedMonthlyIncome - monthlyCosts;

  // Parse funding date
  const fundingMatch = funding.expected?.match(/([A-Za-z]+)\/June?\s*(\d{4})/);
  let fundingMonth: Date | null = null;
  if (funding) {
    fundingMonth = new Date();
    if (funding.expected?.includes("June") || funding.expected?.includes("May")) {
      fundingMonth.setMonth(4, 1); // May index 4, June index 5
      fundingMonth.setFullYear(2026);
    }
  }

  // Generate month-by-month projections
  const now = new Date();
  const projections: {
    month: string;
    monthLabel: string;
    netWorth: number;
    savings: number;
    crypto: number;
    milestone: string | null;
    fundingIncoming: number;
  }[] = [];

  let runningSavings = savings;
  let runningCrypto = crypto;
  let monthsUntilTarget = null;

  for (let i = 0; i <= 24; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const monthLabel = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

    let milestone: string | null = null;
    let fundingIncoming = 0;

    // Check for funding arrival (May or June 2026)
    if (fundingMonth && date >= fundingMonth && i > 0) {
      fundingIncoming = funding.amount || 0;
      milestone = `€${fundingIncoming / 1000}K funding arrives`;
    }

    // Emergency Fund milestone
    if (runningSavings >= 5000 && projections[projections.length - 1]?.milestone !== "Emergency Fund reached!") {
      milestone = "Emergency Fund reached!";
    }

    projections.push({
      month: date.toISOString().split("T")[0],
      monthLabel,
      netWorth: Math.round(runningSavings + runningCrypto),
      savings: Math.round(runningSavings),
      crypto: Math.round(runningCrypto),
      milestone,
      fundingIncoming
    });

    // Advance simulation
    if (fundingIncoming > 0) {
      // Split funding between savings and crypto (70/30)
      runningSavings += fundingIncoming * 0.7;
      runningCrypto += fundingIncoming * 0.3;
    }

    // Apply monthly savings rate
    runningSavings = Math.max(0, runningSavings + monthlySavingsRate);

    // Check target
    if (runningSavings + runningCrypto >= TARGET && monthsUntilTarget === null) {
      monthsUntilTarget = i;
    }
  }

  // Calculate key metrics
  const monthlyBurnPlusSavings = monthlySavingsRate; // net savings per month
  const monthsTo50K = monthsUntilTarget;

  // Milestones
  const milestones = [
    {
      label: "Emergency Fund",
      target: 5000,
      current: savings,
      pct: Math.round((savings / 5000) * 100),
      status: savings >= 5000 ? "complete" : "in_progress"
    },
    {
      label: "€12K Net Worth",
      target: 12000,
      current: netWorth,
      pct: Math.round((netWorth / 12000) * 100),
      status: netWorth >= 12000 ? "complete" : "in_progress"
    },
    {
      label: "€25K Net Worth",
      target: 25000,
      current: netWorth,
      pct: Math.round((netWorth / 25000) * 100),
      status: netWorth >= 25000 ? "complete" : "in_progress"
    },
    {
      label: "€50K FI Target",
      target: 50000,
      current: netWorth,
      pct: Math.round((netWorth / 50000) * 100),
      status: netWorth >= 50000 ? "complete" : "in_progress"
    }
  ];

  // Projection line: net worth over next 12 months
  const projectionLine = projections.slice(0, 13).map(p => ({ month: p.monthLabel, netWorth: p.netWorth, milestone: p.milestone }));

  return NextResponse.json({
    current: {
      netWorth,
      savings,
      crypto,
      monthlyCosts,
      monthlyIncome: estimatedMonthlyIncome,
      monthlySavingsRate,
      sparquote: estimatedMonthlyIncome > 0 ? Math.round((monthlySavingsRate / estimatedMonthlyIncome) * 100) : 0
    },
    target: TARGET,
    monthsTo50K,
    milestones,
    projectionLine,
    projections: projections.slice(0, 13),
    funding,
    summary: {
      message: monthsTo50K !== null
        ? `${monthsTo50K} months to €50K FI at current trajectory`
        : "Already at €50K+ net worth!",
      monthlyBurn: monthlyCosts,
      monthlySavings: monthlySavingsRate,
      fundingArriving: funding.amount ? `€${funding.amount / 1000}K ${funding.expected}` : null
    }
  });
}
