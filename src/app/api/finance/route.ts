import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { berlinDateStr } from "@/lib/date";

const DEFAULT_DATA = {
  savings: 2000,
  crypto: 10000,
  monthlyCosts: 1000,
  funding: { status: "pending", amount: 12000, expected: "May/June 2026" },
  transactions: [],
  savingsGoals: [
    { id: "1", name: "Emergency Fund", target: 5000, current: 2000 },
    { id: "2", name: "Business Investment", target: 10000, current: 0 }
  ],
  lastUpdated: null
};

// GET /api/finance - Get all finance data
export async function GET() {
  const data = (await storage.get("finance")) ?? DEFAULT_DATA;
  const netWorth = data.savings + data.crypto;
  const monthlyCosts = data.monthlyCosts || 1000;
  const runwayMonths = monthlyCosts > 0 ? Math.round(netWorth / monthlyCosts) : null;
  const grantMonths = data.funding?.status === "confirmed" ? (data.funding?.amount || 0) / monthlyCosts : null;

  return NextResponse.json({
    ...data,
    computed: {
      netWorth,
      runwayMonths,
      grantMonths,
      savingsProgress: data.savingsGoals[0] ? Math.round((data.savingsGoals[0].current / data.savingsGoals[0].target) * 100) : null,
      emergencyFundComplete: data.savingsGoals[0] ? data.savingsGoals[0].current >= data.savingsGoals[0].target : false,
    }
  });
}

// POST /api/finance - Add transaction or update values
export async function POST(req: Request) {
  const body = await req.json();
  const data = (await storage.get("finance")) ?? DEFAULT_DATA;

  if (body.action === "addTransaction") {
    const transaction = {
      id: Date.now().toString(),
      date: body.date || berlinDateStr(),
      type: body.type || "expense",
      category: body.category || "other",
      amount: body.amount || 0,
      description: body.description || "",
      createdAt: new Date().toISOString()
    };
    data.transactions.push(transaction);
    if (body.type === "income") {
      if (body.category === "savings") data.savings += body.amount;
      if (body.category === "crypto") data.crypto += body.amount;
    } else {
      data.savings = Math.max(0, data.savings - body.amount);
    }
    await storage.set("finance", data);
    return NextResponse.json({ success: true, transaction, data });
  }

  if (body.action === "updateValues") {
    if (body.savings !== undefined) data.savings = body.savings;
    if (body.crypto !== undefined) data.crypto = body.crypto;
    if (body.monthlyCosts !== undefined) data.monthlyCosts = body.monthlyCosts;
    if (body.funding) data.funding = { ...data.funding, ...body.funding };
    await storage.set("finance", data);
    return NextResponse.json({ success: true, data });
  }

  if (body.action === "addSavingsGoal") {
    const goal = { id: Date.now().toString(), name: body.name || "New Goal", target: body.target || 1000, current: body.current || 0 };
    data.savingsGoals.push(goal);
    await storage.set("finance", data);
    return NextResponse.json({ success: true, goal, data });
  }

  if (body.action === "updateSavingsGoal") {
    const goalIndex = data.savingsGoals.findIndex((g: any) => g.id === body.id);
    if (goalIndex !== -1) {
      data.savingsGoals[goalIndex] = { ...data.savingsGoals[goalIndex], ...body };
      await storage.set("finance", data);
      return NextResponse.json({ success: true, goal: data.savingsGoals[goalIndex], data });
    }
    return NextResponse.json({ success: false, error: "Goal not found" }, { status: 404 });
  }

  if (body.action === "contributeToGoal") {
    const { goalId, amount } = body;
    const goalIndex = data.savingsGoals.findIndex((g: any) => g.id === goalId);
    if (goalIndex === -1) return NextResponse.json({ success: false, error: "Goal not found" }, { status: 404 });
    if (amount > data.savings) return NextResponse.json({ success: false, error: "Insufficient savings" }, { status: 400 });
    data.savings -= amount;
    data.savingsGoals[goalIndex].current = (data.savingsGoals[goalIndex].current || 0) + amount;
    await storage.set("finance", data);
    return NextResponse.json({ success: true, goal: data.savingsGoals[goalIndex], data });
  }

  if (body.action === "getMonthlySummary") {
    const year = body.year || new Date().getFullYear();
    const month = body.month !== undefined ? body.month : new Date().getMonth();
    const monthlyTransactions = data.transactions.filter((t: any) => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === year && tDate.getMonth() === month;
    });
    const income = monthlyTransactions.filter((t: any) => t.type === "income").reduce((sum: number, t: any) => sum + t.amount, 0);
    const expenses = monthlyTransactions.filter((t: any) => t.type === "expense").reduce((sum: number, t: any) => sum + t.amount, 0);
    return NextResponse.json({ year, month, income, expenses, net: income - expenses, transactionCount: monthlyTransactions.length, transactions: monthlyTransactions });
  }

  if (body.action === "deleteTransaction") {
    const txIndex = data.transactions.findIndex((t: any) => t.id === body.id);
    if (txIndex === -1) return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    data.transactions.splice(txIndex, 1);
    await storage.set("finance", data);
    return NextResponse.json({ success: true, data });
  }

  if (body.savings !== undefined) data.savings = body.savings;
  if (body.crypto !== undefined) data.crypto = body.crypto;
  if (body.monthlyCosts !== undefined) data.monthlyCosts = body.monthlyCosts;
  if (body.funding) data.funding = { ...data.funding, ...body.funding };
  await storage.set("finance", data);
  return NextResponse.json({ success: true, data });
}
