import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "finance.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {
      savings: 2000,
      crypto: 10000,
      monthlyCosts: 1000,
      funding: { status: "pending", amount: 12000, expected: "May/June 2026" },
      transactions: [],
      savingsGoals: [
        { id: "1", name: "Emergency Fund", target: 5000, current: 2000 },
        { id: "2", name: "Business Investment", target: 10000, current: 0 }
      ],
      lastUpdated: new Date().toISOString()
    };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  ensureDataDir();
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/finance - Get all finance data
export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

// POST /api/finance - Add transaction or update values
export async function POST(req: Request) {
  const body = await req.json();
  const data = readData();

  // Handle different actions
  if (body.action === "addTransaction") {
    const transaction = {
      id: Date.now().toString(),
      date: body.date || new Date().toISOString().split("T")[0],
      type: body.type || "expense", // income or expense
      category: body.category || "other",
      amount: body.amount || 0,
      description: body.description || "",
      createdAt: new Date().toISOString()
    };
    data.transactions.push(transaction);

    // Update savings/crypto based on transaction
    if (body.type === "income") {
      if (body.category === "savings") data.savings += body.amount;
      if (body.category === "crypto") data.crypto += body.amount;
    } else {
      // Expenses deduct from savings (fixed monthlyCosts stays as budget, not cumulative)
      data.savings = Math.max(0, data.savings - body.amount);
    }

    writeData(data);
    return NextResponse.json({ success: true, transaction, data });
  }

  if (body.action === "updateValues") {
    if (body.savings !== undefined) data.savings = body.savings;
    if (body.crypto !== undefined) data.crypto = body.crypto;
    if (body.monthlyCosts !== undefined) data.monthlyCosts = body.monthlyCosts;
    if (body.funding) data.funding = { ...data.funding, ...body.funding };

    writeData(data);
    return NextResponse.json({ success: true, data });
  }

  if (body.action === "addSavingsGoal") {
    const goal = {
      id: Date.now().toString(),
      name: body.name || "New Goal",
      target: body.target || 1000,
      current: body.current || 0
    };
    data.savingsGoals.push(goal);
    writeData(data);
    return NextResponse.json({ success: true, goal, data });
  }

  if (body.action === "updateSavingsGoal") {
    const goalIndex = data.savingsGoals.findIndex((g: any) => g.id === body.id);
    if (goalIndex !== -1) {
      data.savingsGoals[goalIndex] = { ...data.savingsGoals[goalIndex], ...body };
      writeData(data);
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
    writeData(data);
    return NextResponse.json({ success: true, goal: data.savingsGoals[goalIndex], data });
  }

  if (body.action === "getMonthlySummary") {
    const year = body.year || new Date().getFullYear();
    const month = body.month !== undefined ? body.month : new Date().getMonth();

    const monthlyTransactions = data.transactions.filter((t: any) => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === year && tDate.getMonth() === month;
    });

    const income = monthlyTransactions
      .filter((t: any) => t.type === "income")
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter((t: any) => t.type === "expense")
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    return NextResponse.json({
      year,
      month,
      income,
      expenses,
      net: income - expenses,
      transactionCount: monthlyTransactions.length,
      transactions: monthlyTransactions
    });
  }

  // Default: update finance values
  if (body.savings !== undefined) data.savings = body.savings;
  if (body.crypto !== undefined) data.crypto = body.crypto;
  if (body.monthlyCosts !== undefined) data.monthlyCosts = body.monthlyCosts;
  if (body.funding) data.funding = { ...data.funding, ...body.funding };

  writeData(data);
  return NextResponse.json({ success: true, data });
}