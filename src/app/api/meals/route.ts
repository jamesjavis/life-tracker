import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "meals.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) return { meals: [], dailyGoals: { protein: 150, carbs: 250, calories: 2200 }, lastReset: null };
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  const data = readData();
  const today = new Date().toISOString().split("T")[0];
  
  const todayMeals = data.meals.filter((m: any) => m.date === today);
  const dailyNutrition = todayMeals.reduce((acc: any, m: any) => {
    acc.protein += m.protein || 0;
    acc.carbs += m.carbs || 0;
    acc.fat += m.fat || 0;
    acc.calories += m.calories || 0;
    return acc;
  }, { protein: 0, carbs: 0, fat: 0, calories: 0 });

  const weeklyMeals = data.meals.filter((m: any) => {
    const d = new Date(m.date);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  });

  const weeklyAvg = weeklyMeals.length > 0 ? {
    calories: Math.round(weeklyMeals.reduce((s: number, m: any) => s + (m.calories || 0), 0) / weeklyMeals.length),
    protein: Math.round(weeklyMeals.reduce((s: number, m: any) => s + (m.protein || 0), 0) / weeklyMeals.length),
  } : { calories: 0, protein: 0 };

  return NextResponse.json({
    dailyGoals: data.dailyGoals,
    todayMeals,
    dailyNutrition,
    weeklyAvg,
    recent: data.meals.slice(-20).reverse(),
  });
}

export async function POST(req: Request) {
  const { action, meal } = await req.json();
  const data = readData();

  if (action === "add") {
    data.meals.push({
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toISOString(),
      name: meal.name,
      calories: Number(meal.calories) || 0,
      protein: Number(meal.protein) || 0,
      carbs: Number(meal.carbs) || 0,
      fat: Number(meal.fat) || 0,
    });
    writeData(data);
    return NextResponse.json({ success: true });
  }

  if (action === "updateGoals") {
    data.dailyGoals = { ...data.dailyGoals, ...meal };
    writeData(data);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
