import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function readJson(filename: string) {
  const file = path.join(process.cwd(), "data", filename);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch { return null; }
}

function score(data: any) {
  // Returns 0-100 score with breakdown
  const scores: Record<string, number> = {};
  let total = 0;

  // === SLEEP (25 points) ===
  const sleepEntries = data.sleep?.entries || [];
  const last7sleep = sleepEntries.slice(-7);
  const sleepHours = last7sleep.map((e: any) => e.duration || 0);
  const avgSleep = sleepHours.length > 0 ? sleepHours.reduce((a: number, b: number) => a + b, 0) / sleepHours.length : 0;
  const sleepQuality = last7sleep.length > 0
    ? last7sleep.reduce((s: number, e: any) => s + (e.quality || 0), 0) / last7sleep.length
    : 0;
  const sleepScore = Math.min(avgSleep / 8, 1) * 12.5 + Math.min(sleepQuality / 5, 1) * 12.5;
  scores.sleep = Math.round(sleepScore);
  total += 25;

  // === MOOD (20 points) ===
  const moodEntries = data.mood?.entries || [];
  const last7mood = moodEntries.slice(-7);
  const avgMood = last7mood.length > 0
    ? last7mood.reduce((s: number, e: any) => s + (e.mood || 0), 0) / last7mood.length
    : 0;
  const avgEnergy = last7mood.length > 0
    ? last7mood.reduce((s: number, e: any) => s + (e.energy || 0), 0) / last7mood.length
    : 0;
  const moodScore = (Math.min(avgMood / 8, 1) * 10) + (Math.min(avgEnergy / 8, 1) * 10);
  scores.mood = Math.round(moodScore);
  total += 20;

  // === GYM (25 points) ===
  const gymLogs: string[] = data.gym?.logs || [];
  const now = new Date();
  let gymDaysLast14 = 0;
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split("T")[0];
    if (gymLogs.includes(dayStr)) gymDaysLast14++;
  }
  const gymFreqScore = Math.min(gymDaysLast14 / 6, 1) * 25; // 6 sessions in 14 days = full score
  scores.gym = Math.round(gymFreqScore);
  total += 25;

  // === HABITS (15 points) ===
  const habitsMap = data.habits?.habits || {};
  const today = new Date().toISOString().split("T")[0];
  let habitScore = 0;
  if (habitsMap[today]) {
    const done = Object.values(habitsMap[today]).filter(Boolean).length;
    habitScore = Math.min(done / 9, 1) * 15;
  }
  scores.habits = Math.round(habitScore);
  total += 15;

  // === HYDRATION (10 points) ===
  const waterEntries = data.water?.entries || [];
  const last7water = waterEntries.slice(-7);
  const avgWater = last7water.length > 0
    ? last7water.reduce((s: number, e: any) => s + (e.glasses || 0), 0) / last7water.length
    : 0;
  const waterScore = Math.min(avgWater / 8, 1) * 10;
  scores.water = Math.round(waterScore);
  total += 10;

  // === NUTRITION (10 points) ===
  const mealsEntries = data.meals?.entries || [];
  const last7meals = mealsEntries.slice(-7);
  const avgCalories = last7meals.length > 0
    ? last7meals.reduce((s: number, m: any) => s + (m.calories || 0), 0) / last7meals.length
    : 0;
  const caloriesScore = avgCalories >= 1500 && avgCalories <= 2800
    ? 10
    : avgCalories < 1500
    ? 5
    : 7;
  scores.nutrition = caloriesScore;
  total += 10;

  return { scores, total: Object.values(scores).reduce((a, b) => a + b, 0) };
}

function generateInsights(data: any, scores: Record<string, number>) {
  const insights: { category: string; icon: string; headline: string; detail: string; priority: "high" | "medium" | "low" }[] = [];
  const now = new Date();

  // === SLEEP ===
  const sleepEntries = data.sleep?.entries || [];
  const last7sleep = sleepEntries.slice(-7);
  const avgSleep = last7sleep.length > 0
    ? last7sleep.reduce((s: number, e: any) => s + (e.duration || 0), 0) / last7sleep.length
    : 0;
  const lastSleepEntry = sleepEntries[sleepEntries.length - 1];
  const daysSinceSleep = lastSleepEntry
    ? Math.floor((now.getTime() - new Date(lastSleepEntry.date + "T00:00:00").getTime()) / 86400000)
    : null;

  if (daysSinceSleep === null || daysSinceSleep >= 7) {
    insights.push({
      category: "sleep",
      icon: "🌙",
      headline: "Schlaf-Tracking wieder aufnehmen",
      detail: `${daysSinceSleep === null ? "Keine Daten seit Beginn" : `Letzter Eintrag vor ${daysSinceSleep} Tagen`}. Schlaf ist die Grundlage für alles – Energie, Stimmung, Recovery. Ziel: jede Nacht 7-8h mit Quality 7+.`,
      priority: "high"
    });
  } else if (avgSleep < 7) {
    insights.push({
      category: "sleep",
      icon: "⚠️",
      headline: "Schlafdefizit erkannt",
      detail: `Ø ${avgSleep.toFixed(1)}h/ Nacht. Unter 7h senkt Testosteron, erhöht Cortisol und blockiert Muscle Recovery. Mindestens 7h anstreben, ideal 8h.`,
      priority: "high"
    });
  } else if (last7sleep.length >= 5 && avgSleep >= 7.5) {
    insights.push({
      category: "sleep",
      icon: "✅",
      headline: "Schlafqualität solide",
      detail: `Ø ${avgSleep.toFixed(1)}h/ Nacht. Weiter so! Consistency ist King.`,
      priority: "low"
    });
  }

  // === GYM ===
  const gymLogs: string[] = data.gym?.logs || [];
  let lastGymGap = null;
  for (let i = 1; i < 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split("T")[0];
    if (gymLogs.includes(dayStr)) { lastGymGap = i; break; }
  }

  const gymDaysLast14 = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split("T")[0];
    if (gymLogs.includes(dayStr)) gymDaysLast14.push(dayStr);
  }

  if (lastGymGap === null || lastGymGap >= 5) {
    insights.push({
      category: "gym",
      icon: "🏋️",
      headline: "Gym-Rückkehr planen",
      detail: lastGymGap === null
        ? "Noch nie trainiert? Starte mit 2x/Woche und steigere auf 3x."
        : `${lastGymGap} Tage Pause. Mon/Wed/Fri Rhythmus: 2x Woche Minimum, 3x Optimal. Fünf-Satz-System für maximale Gains.`,
      priority: "high"
    });
  } else if (gymDaysLast14.length < 3) {
    insights.push({
      category: "gym",
      icon: "📉",
      headline: "Gym-Frequenz unter Ziel",
      detail: `${gymDaysLast14.length}/6 Sessions in den letzten 14 Tagen. 3-4 Sessions für Erhalt, 5-6 für Gains. Quality > Quantity.`,
      priority: "medium"
    });
  } else if (gymDaysLast14.length >= 5) {
    insights.push({
      category: "gym",
      icon: "🔥",
      headline: "Gym-Programm läuft",
      detail: `${gymDaysLast14.length} Sessions in 14 Tagen. Stark! Achte auf Regeneration – Schlaf & Protein sind genauso wichtig wie das Training selbst.`,
      priority: "low"
    });
  }

  // === MOOD ===
  const moodEntries = data.mood?.entries || [];
  const last7mood = moodEntries.slice(-7);
  const avgMood = last7mood.length > 0
    ? last7mood.reduce((s: number, e: any) => s + (e.mood || 0), 0) / last7mood.length
    : 0;
  const avgEnergy = last7mood.length > 0
    ? last7mood.reduce((s: number, e: any) => s + (e.energy || 0), 0) / last7mood.length
    : 0;
  const lastMoodEntry = moodEntries[moodEntries.length - 1];
  const daysSinceMood = lastMoodEntry
    ? Math.floor((now.getTime() - new Date(lastMoodEntry.date + "T00:00:00").getTime()) / 86400000)
    : null;

  if (daysSinceMood === null || daysSinceMood >= 7) {
    insights.push({
      category: "mood",
      icon: "💭",
      headline: "Mood-Tracking wieder aufnehmen",
      detail: `${daysSinceMood === null ? "Noch nie getrackt" : `${daysSinceMood} Tage keine Daten`}. Tägliche Check-ins zeigen Muster – was hebt/ senkt Stimmung? Mindestens alle 2 Tage loggen.`,
      priority: "high"
    });
  } else if (avgEnergy < 5) {
    insights.push({
      category: "energy",
      icon: "🔋",
      headline: "Energy niedrig – drei Hebel",
      detail: `Ø Energy ${avgEnergy.toFixed(1)}/10. Drei Hauptursachen: (1) Schlafdefizit, (2) Bewegungsmangel, (3) falsche Makros. Priorität: Bewegung > Schlaf > Supplements.`,
      priority: "high"
    });
  } else if (avgMood >= 7 && avgEnergy >= 7) {
    insights.push({
      category: "mood",
      icon: "😊",
      headline: "Stimmung & Energy gut",
      detail: `Ø Mood ${avgMood.toFixed(1)}/10, Energy ${avgEnergy.toFixed(1)}/10. Weiter diesen Kurs halten. Kleine tägliche Actions zählen mehr als große einmalige Changes.`,
      priority: "low"
    });
  }

  // === HABITS ===
  const habitsMap = data.habits?.habits || {};
  const today = new Date().toISOString().split("T")[0];
  const todayHabits = habitsMap[today] || {};
  const doneToday = Object.values(todayHabits).filter(Boolean).length;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const yesterdayHabits = habitsMap[yesterdayStr] || {};
  const doneYesterday = Object.values(yesterdayHabits).filter(Boolean).length;

  if (doneToday === 0 && doneYesterday === 0) {
    insights.push({
      category: "habits",
      icon: "📋",
      headline: "Habits wieder starten",
      detail: "Zwei Tage hintereinander keine Habits getrackt. Klein anfangen: nur 3 Habits heute. Yoga, Lesen, Atemübung – einfach zu starten.",
      priority: "high"
    });
  } else if (doneToday < 5) {
    insights.push({
      category: "habits",
      icon: "⚡",
      headline: `${doneToday}/9 heute erledigt`,
      detail: doneToday === 0
        ? "Zero Habits heute – starte mit dem einfachsten: Creatin oder Smoothie."
        : `${doneToday} Habits gemacht. ${9 - doneToday} übrig. Non-Negotiables zuerst: Gym, Creatin, Lesen.`,
      priority: "medium"
    });
  } else {
    insights.push({
      category: "habits",
      icon: "🎯",
      headline: `${doneToday}/9 heute unterwegs`,
      detail: `${doneToday} von 9 erledigt. Weiter so! Streak-bewusstsein verstärktCompliance.`,
      priority: "low"
    });
  }

  // === WATER ===
  const waterEntries = data.water?.entries || [];
  const last7water = waterEntries.slice(-7);
  const avgWater = last7water.length > 0
    ? last7water.reduce((s: number, e: any) => s + (e.glasses || 0), 0) / last7water.length
    : 0;
  const lastWaterEntry = waterEntries[waterEntries.length - 1];
  const daysSinceWater = lastWaterEntry
    ? Math.floor((now.getTime() - new Date(lastWaterEntry.date + "T00:00:00").getTime()) / 86400000)
    : null;

  if (daysSinceWater === null || daysSinceWater >= 5) {
    insights.push({
      category: "water",
      icon: "💧",
      headline: "Wasser-Tracking wieder aktivieren",
      detail: `${daysSinceWater === null ? "Noch nie getrackt" : `${daysSinceWater} Tage Lücke`}. 8 Gläser/Tag ist Minimum. Jedes Glas zählt – Tracke jeden Tag.`,
      priority: "medium"
    });
  } else if (avgWater < 6) {
    insights.push({
      category: "water",
      icon: "💧",
      headline: `${avgWater.toFixed(0)}/8 Gläser – unter Ziel`,
      detail: `${avgWater.toFixed(0)} Gläser/Tag Ø. Wasser ist der am meisten unterschätzte Hebel für Energy, Haut, Digestion. 8 Gläser als Minimum.`,
      priority: "medium"
    });
  }

  // === NUTRITION ===
  const mealsEntries = data.meals?.entries || [];
  const last7meals = mealsEntries.slice(-7);
  const avgCalories = last7meals.length > 0
    ? last7meals.reduce((s: number, m: any) => s + (m.calories || 0), 0) / last7meals.length
    : 0;
  const avgProtein = last7meals.length > 0
    ? last7meals.reduce((s: number, m: any) => s + (m.protein || 0), 0) / last7meals.length
    : 0;

  if (last7meals.length < 3) {
    insights.push({
      category: "nutrition",
      icon: "🍽️",
      headline: "Essen tracken – der fehlende Hebel",
      detail: `${last7meals.length} Mahlzeiten in 7 Tagen geloggt. Keine Daten = keine Insights. Ab heute jede Mahlzeit tracken. 150g+ Protein/Tag als Ziel.`,
      priority: "medium"
    });
  } else if (avgProtein < 100 && avgCalories > 1500) {
    insights.push({
      category: "nutrition",
      icon: "💪",
      headline: "Mehr Protein nötig",
      detail: `Ø ${avgProtein.toFixed(0)}g Protein/Tag. Für Muscle Recovery & Sättigung sind 150g+ nötig. Protein Shake nach Gym, Eier zum Frühstück, Hähnchen zum Abendessen.`,
      priority: "medium"
    });
  }

  // === WEIGHT ===
  const weightEntries = data.weight?.entries || [];
  const lastWeight = weightEntries[weightEntries.length - 1];
  const prevWeight = weightEntries.length >= 2 ? weightEntries[weightEntries.length - 2] : null;
  const daysSinceWeight = lastWeight
    ? Math.floor((now.getTime() - new Date(lastWeight.date + "T00:00:00").getTime()) / 86400000)
    : null;

  if (lastWeight && (daysSinceWeight === null || daysSinceWeight >= 14)) {
    insights.push({
      category: "weight",
      icon: "⚖️",
      headline: "Gewicht wieder wiegen",
      detail: `Letztes Gewicht vor ${daysSinceWeight} Tagen: ${lastWeight.weight} kg. Wöchentliches Wiegen zeigt Trends. Ziel: 75kg. Einfach Tuesday morning nach dem Klo.`,
      priority: "medium"
    });
  } else if (lastWeight && prevWeight) {
    const change = lastWeight.weight - prevWeight.weight;
    if (Math.abs(change) > 1) {
      insights.push({
        category: "weight",
        icon: change > 0 ? "📈" : "📉",
        headline: `${change > 0 ? "+" : ""}${change.toFixed(1)} kg seit letztem Wiegen`,
        detail: change > 0
          ? `${change.toFixed(1)}kg Zunahme. Kalorienüberschuss oder Wassereinlagerungen? Detailliertes Food-Tracking hilft.`
          : `${Math.abs(change).toFixed(1)}kg Abnahme. Falls ungewollt: mehr Protein, mehr Schlaf. Falls gewollt: weiter so!`,
        priority: "low"
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return insights;
}

export async function GET() {
  const data = {
    sleep: readJson("sleep.json"),
    mood: readJson("mood.json"),
    gym: readJson("gym.json"),
    habits: readJson("habits.json"),
    water: readJson("water.json"),
    meals: readJson("meals.json"),
    weight: readJson("weight.json"),
  };

  const { scores, total } = score(data);
  const insights = generateInsights(data, scores);

  return NextResponse.json({
    score: total,
    breakdown: scores,
    insights,
    generatedAt: new Date().toISOString(),
  });
}