import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const DEFAULT_DATA = { entries: [], dailyGoals: { protein: 150, carbs: 250, calories: 2200 }, lastReset: null };

export async function GET() {
  const data = (await storage.get("meals")) ?? DEFAULT_DATA;
  const today = new Date().toISOString().split("T")[0];
  const todayMeals = data.entries.filter((m: any) => m.date === today);
  const dailyNutrition = todayMeals.reduce((acc: any, m: any) => {
    acc.protein += m.protein || 0;
    acc.carbs += m.carbs || 0;
    acc.fat += m.fat || 0;
    acc.calories += m.calories || 0;
    return acc;
  }, { protein: 0, carbs: 0, fat: 0, calories: 0 });

  const weeklyMeals = data.entries.filter((m: any) => {
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
    recent: data.entries.slice(-20).reverse(),
  });
}

export async function POST(req: Request) {
  const { action, meal } = await req.json();
  const data = (await storage.get("meals")) ?? DEFAULT_DATA;

  if (action === "add") {
    data.entries.push({
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      time: new Date().toISOString(),
      name: meal.name,
      calories: Number(meal.calories) || 0,
      protein: Number(meal.protein) || 0,
      carbs: Number(meal.carbs) || 0,
      fat: Number(meal.fat) || 0,
    });
    await storage.set("meals", data);
    return NextResponse.json({ success: true });
  }

  if (action === "retro") {
    // Backfill a past date with a meal entry
    const retroDate = meal?.date;
    if (!meal?.name || !retroDate) return NextResponse.json({ error: "meal.name and meal.date required for retro" }, { status: 400 });
    data.entries.push({
      id: Date.now().toString(),
      date: retroDate,
      time: new Date(retroDate).toISOString(),
      name: meal.name,
      calories: Number(meal.calories) || 0,
      protein: Number(meal.protein) || 0,
      carbs: Number(meal.carbs) || 0,
      fat: Number(meal.fat) || 0,
    });
    await storage.set("meals", data);
    return NextResponse.json({ success: true, entry: data.entries[data.entries.length - 1] });
  }
}
