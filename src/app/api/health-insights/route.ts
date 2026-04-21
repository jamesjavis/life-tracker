import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

async function getData() {
  const [sleep, mood, gym, habits, water, meals, weight, supplements] = await Promise.all([
    storage.get("sleep"),
    storage.get("mood"),
    storage.get("gym"),
    storage.get("habits"),
    storage.get("water"),
    storage.get("meals"),
    storage.get("weight"),
    storage.get("supplements"),
  ]);
  return { sleep, mood, gym, habits, water, meals, weight, supplements };
}

function score(data: any) {
  const scores: Record<string, number> = {};
  let total = 0;
  const sleepEntries = data.sleep?.entries || [];
  const last7sleep = sleepEntries.slice(0, 7);
  const avgSleep = last7sleep.length > 0 ? last7sleep.reduce((a: number, b: any) => a + (b.duration || b.hours || 0), 0) / last7sleep.length : 0;
  const sleepQuality = last7sleep.length > 0 ? last7sleep.reduce((s: number, e: any) => s + (e.quality || 0), 0) / last7sleep.length : 0;
  scores.sleep = Math.round(Math.min(avgSleep / 8, 1) * 12.5 + Math.min(sleepQuality / 10, 1) * 12.5);
  total += 25;
  const moodEntries = data.mood?.entries || [];
  const last7mood = moodEntries.slice(0, 7);
  const avgMood = last7mood.length > 0 ? last7mood.reduce((s: number, e: any) => s + (e.mood || 0), 0) / last7mood.length : 0;
  const avgEnergy = last7mood.length > 0 ? last7mood.reduce((s: number, e: any) => s + (e.energy || 0), 0) / last7mood.length : 0;
  scores.mood = Math.round(Math.min(avgMood / 8, 1) * 10 + Math.min(avgEnergy / 8, 1) * 10);
  total += 20;
  const gymLogs: string[] = data.gym?.logs || [];
  const now = new Date();
  let gymDaysLast14: string[] = [];
  for (let i = 0; i < 14; i++) { const d = new Date(now); d.setDate(d.getDate() - i); if (gymLogs.includes(d.toISOString().split("T")[0])) gymDaysLast14.push(d.toISOString().split("T")[0]); }
  scores.gym = Math.round(Math.min(gymDaysLast14.length / 6, 1) * 25);
  total += 25;
  const habitsMap = data.habits?.habits || {};
  const today = new Date().toISOString().split("T")[0];
  let habitScore = 0;
  if (habitsMap[today]) { const done = Object.values(habitsMap[today]).filter(Boolean).length; habitScore = Math.min(done / 9, 1) * 15; }
  scores.habits = Math.round(habitScore);
  total += 15;
  const waterEntries = data.water?.entries || [];
  const last7water = waterEntries.slice(-7);
  const avgWater = last7water.length > 0 ? last7water.reduce((s: number, e: any) => s + (e.glasses || 0), 0) / last7water.length : 0;
  scores.water = Math.round(Math.min(avgWater / 8, 1) * 10);
  total += 10;
  const mealsEntries = data.meals?.entries || [];
  const last7meals = mealsEntries.slice(-7);
  const avgCalories = last7meals.length > 0 ? last7meals.reduce((s: number, m: any) => s + (m.calories || 0), 0) / last7meals.length : 0;
  scores.nutrition = avgCalories >= 1500 && avgCalories <= 2800 ? 10 : avgCalories < 1500 ? 5 : 7;
  total += 10;

  // Supplements: days with supplements taken in last 7 days
  const supplementList = data.supplements?.supplements || [];
  const supplementLog = data.supplements?.log || [];
  const now2 = new Date();
  const last7supps = supplementLog.filter((e: any) => {
    const d = new Date(e.date);
    return (now2.getTime() - d.getTime()) / 86400000 <= 7;
  });
  const uniqueSuppDays = new Set(last7supps.map((e: any) => e.date)).size;
  const totalSuppSlots = supplementList.length * 7;
  scores.supplements = totalSuppSlots > 0 ? Math.round(Math.min((uniqueSuppDays * supplementList.length) / totalSuppSlots, 1) * 10) : 0;
  total += 10;

  return { scores, total: Object.values(scores).reduce((a, b) => a + b, 0) };
}

function getBerlinDate() { const offset = 2 * 60; const d = new Date(); return new Date(d.getTime() + offset * 60 * 1000 - d.getTimezoneOffset() * 60 * 1000); }
function parseBerlinDate(dateStr: string) { const [y, m, d] = dateStr.split("-").map(Number); return new Date(y, m - 1, d, 0, 0, 0, 0); }
function formatBerlinDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function daysBetween(date: Date, now: Date) { return Math.floor((now.getTime() - date.getTime()) / 86400000); }

function generateInsights(data: any, scores: Record<string, number>) {
  const insights: any[] = [];
  const now = getBerlinDate();
  const todayStr = now.toISOString().split("T")[0];

  const sleepEntries = data.sleep?.entries || [];
  const last7sleep = sleepEntries.slice(0, 7);
  const avgSleep = last7sleep.length > 0 ? last7sleep.reduce((s: number, e: any) => s + (e.duration || e.hours || 0), 0) / last7sleep.length : 0;
  const lastSleepEntry = sleepEntries[0];
  const daysSinceSleep = lastSleepEntry ? daysBetween(parseBerlinDate(lastSleepEntry.date), now) : null;

  if (daysSinceSleep === null || daysSinceSleep >= 7) {
    insights.push({ category: "sleep", icon: "🌙", headline: "Schlaf-Tracking wieder aufnehmen", detail: `${daysSinceSleep === null ? "Keine Daten seit Beginn" : `Letzter Eintrag vor ${daysSinceSleep} Tagen`}. Schlaf ist die Grundlage für alles.`, priority: "high" });
  } else if (avgSleep < 7) {
    insights.push({ category: "sleep", icon: "⚠️", headline: "Schlafdefizit erkannt", detail: `Ø ${avgSleep.toFixed(1)}h/Nacht. Unter 7h senkt Testosteron, erhöht Cortisol. Mindestens 7h anstreben.`, priority: "high" });
  } else if (last7sleep.length >= 5 && avgSleep >= 7.5) {
    insights.push({ category: "sleep", icon: "✅", headline: "Schlafqualität solide", detail: `Ø ${avgSleep.toFixed(1)}h/Nacht. Weiter so!`, priority: "low" });
  }

  const gymLogs: string[] = data.gym?.logs || [];
  let lastGymGap = null;
  for (let i = 1; i < 30; i++) { const d = new Date(now.getTime() - i * 86400000); const dayStr = formatBerlinDate(d); if (gymLogs.includes(dayStr)) { lastGymGap = i; break; } }
  let gymDaysLast14: string[] = [];
  for (let i = 0; i < 14; i++) { const d = new Date(now.getTime() - i * 86400000); if (gymLogs.includes(formatBerlinDate(d))) gymDaysLast14.push(formatBerlinDate(d)); }

  if (lastGymGap === null || lastGymGap >= 5) {
    insights.push({ category: "gym", icon: "🏋️", headline: "Gym-Rückkehr planen", detail: lastGymGap === null ? "Noch nie trainiert? Starte mit 2x/Woche." : `${lastGymGap} Tage Pause. Mon/Wed/Fri Rhythmus.`, priority: "high" });
  } else if (gymDaysLast14.length < 3) {
    insights.push({ category: "gym", icon: "📉", headline: "Gym-Frequenz unter Ziel", detail: `${gymDaysLast14.length}/6 Sessions in 14 Tagen. 3-4 für Erhalt, 5-6 für Gains.`, priority: "medium" });
  } else if (gymDaysLast14.length >= 5) {
    insights.push({ category: "gym", icon: "🔥", headline: "Gym-Programm läuft", detail: `${gymDaysLast14.length} Sessions in 14 Tagen. Stark!`, priority: "low" });
  }

  const moodEntries = data.mood?.entries || [];
  const last7mood = moodEntries.slice(0, 7);
  const avgMood2 = last7mood.length > 0 ? last7mood.reduce((s: number, e: any) => s + (e.mood || 0), 0) / last7mood.length : 0;
  const avgEnergy2 = last7mood.length > 0 ? last7mood.reduce((s: number, e: any) => s + (e.energy || 0), 0) / last7mood.length : 0;
  const lastMoodEntry = moodEntries[0];
  const daysSinceMood = lastMoodEntry ? daysBetween(parseBerlinDate(lastMoodEntry.date), now) : null;

  if (daysSinceMood === null || daysSinceMood >= 7) {
    insights.push({ category: "mood", icon: "💭", headline: "Mood-Tracking wieder aufnehmen", detail: `${daysSinceMood === null ? "Noch nie getrackt" : `${daysSinceMood} Tage keine Daten`}. Tägliche Check-ins zeigen Muster.`, priority: "high" });
  } else if (avgEnergy2 < 5) {
    insights.push({ category: "energy", icon: "🔋", headline: "Energy niedrig – drei Hebel", detail: `Ø Energy ${avgEnergy2.toFixed(1)}/10. Bewegung > Schlaf > Supplements.`, priority: "high" });
  } else if (avgMood2 >= 7 && avgEnergy2 >= 7) {
    insights.push({ category: "mood", icon: "😊", headline: "Stimmung & Energy gut", detail: `Ø Mood ${avgMood2.toFixed(1)}/10, Energy ${avgEnergy2.toFixed(1)}/10. Weiter diesen Kurs halten.`, priority: "low" });
  }

  const habitsMap = data.habits?.habits || {};
  const todayHabits = habitsMap[todayStr] || {};
  const doneToday = Object.values(todayHabits).filter(Boolean).length;
  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayStr = formatBerlinDate(yesterday);
  const doneYesterday = Object.values(habitsMap[yesterdayStr] || {}).filter(Boolean).length;

  if (doneToday === 0 && doneYesterday === 0) {
    insights.push({ category: "habits", icon: "📋", headline: "Habits wieder starten", detail: "Zwei Tage hintereinander keine Habits. Klein anfangen: nur 3 heute.", priority: "high" });
  } else if (doneToday < 5) {
    insights.push({ category: "habits", icon: "⚡", headline: `${doneToday}/9 heute erledigt`, detail: doneToday === 0 ? "Zero Habits heute – starte mit Creatin oder Smoothie." : `${doneToday} gemacht. Non-Negotiables zuerst: Gym, Creatin, Lesen.`, priority: "medium" });
  } else {
    insights.push({ category: "habits", icon: "🎯", headline: `${doneToday}/9 heute unterwegs`, detail: `${doneToday} von 9 erledigt. Weiter so!`, priority: "low" });
  }

  const waterEntries = data.water?.entries || [];
  const last7water = waterEntries.slice(-7);
  const avgWater = last7water.length > 0 ? last7water.reduce((s: number, e: any) => s + (e.glasses || 0), 0) / last7water.length : 0;
  const lastWaterEntry = waterEntries[waterEntries.length - 1];
  const daysSinceWater = lastWaterEntry ? daysBetween(parseBerlinDate(lastWaterEntry.date), now) : null;

  if (daysSinceWater === null || daysSinceWater >= 5) {
    insights.push({ category: "water", icon: "💧", headline: "Wasser-Tracking wieder aktivieren", detail: `${daysSinceWater === null ? "Noch nie" : `${daysSinceWater} Tage Lücke`}. 8 Gläser/Tag Minimum.`, priority: "medium" });
  } else if (avgWater < 6) {
    insights.push({ category: "water", icon: "💧", headline: `${avgWater.toFixed(0)}/8 Gläser – unter Ziel`, detail: `${avgWater.toFixed(0)} Gläser/Tag Ø. Wasser ist der am meisten unterschätzte Hebel.`, priority: "medium" });
  }

  const mealsEntries = data.meals?.entries || [];
  const last7meals = mealsEntries.slice(-7);
  const avgProtein = last7meals.length > 0 ? last7meals.reduce((s: number, m: any) => s + (m.protein || 0), 0) / last7meals.length : 0;
  const avgCalories = last7meals.length > 0 ? last7meals.reduce((s: number, m: any) => s + (m.calories || 0), 0) / last7meals.length : 0;

  if (last7meals.length < 3) {
    insights.push({ category: "nutrition", icon: "🍽️", headline: "Essen tracken – der fehlende Hebel", detail: `${last7meals.length} Mahlzeiten in 7 Tagen geloggt. Ab heute jede Mahlzeit tracken. 150g+ Protein/Tag als Ziel.`, priority: "medium" });
  } else if (avgProtein < 100 && avgCalories > 1500) {
    insights.push({ category: "nutrition", icon: "💪", headline: "Mehr Protein nötig", detail: `Ø ${avgProtein.toFixed(0)}g Protein/Tag. Für Muscle Recovery sind 150g+ nötig.`, priority: "medium" });
  }

  const weightEntries = data.weight?.entries || [];
  const lastWeight = weightEntries[weightEntries.length - 1];
  const prevWeight = weightEntries.length >= 2 ? weightEntries[weightEntries.length - 2] : null;
  const daysSinceWeight = lastWeight ? daysBetween(parseBerlinDate(lastWeight.date), now) : null;

  if (lastWeight && (daysSinceWeight === null || daysSinceWeight >= 14)) {
    insights.push({ category: "weight", icon: "⚖️", headline: "Gewicht wieder wiegen", detail: `Letztes Gewicht vor ${daysSinceWeight} Tagen: ${lastWeight.weight} kg. Wöchentliches Wiegen zeigt Trends.`, priority: "medium" });
  } else if (lastWeight && prevWeight) {
    const change = lastWeight.weight - prevWeight.weight;
    if (Math.abs(change) > 1) {
      insights.push({ category: "weight", icon: change > 0 ? "📈" : "📉", headline: `${change > 0 ? "+" : ""}${change.toFixed(1)} kg seit letztem Wiegen`, detail: change > 0 ? `${change.toFixed(1)}kg Zunahme. Kalorienüberschuss?` : `${Math.abs(change).toFixed(1)}kg Abnahme. Falls ungewollt: mehr Protein, mehr Schlaf.`, priority: "low" });
    }
  }


  // Supplements insight
  const supplementList2 = data.supplements?.supplements || [];
  const supplementLog2 = data.supplements?.log || [];
  const now3 = getBerlinDate();
  const today3 = now3.toISOString().split("T")[0];
  const last7supps2 = supplementLog2.filter((e: any) => {
    const d = new Date(e.date);
    return (now3.getTime() - d.getTime()) / 86400000 <= 7;
  });
  const uniqueSuppDays2 = new Set(last7supps2.map((e: any) => e.date)).size;
  const takenToday = supplementLog2.filter((e: any) => e.date === today3).length;
  const lastSuppEntry: any = supplementLog2[0];
  const daysSinceSupp = lastSuppEntry ? daysBetween(new Date(lastSuppEntry.date), now3) : null;

  if (daysSinceSupp === null || daysSinceSupp >= 7) {
    insights.push({ category: "supplements", icon: "💊", headline: "Supplements wieder tracken", detail: daysSinceSupp === null ? "Noch nie Supplements geloggt." : "Letzter Eintrag vor " + daysSinceSupp + " Tagen. " + supplementList2.length + " Supplements konfiguriert.", priority: "high" });
  } else if (takenToday === 0 && supplementList2.length > 0) {
    insights.push({ category: "supplements", icon: "⏰", headline: "Supplements heute noch nicht genommen", detail: takenToday + "/" + supplementList2.length + " heute. Nicht vergessen!", priority: "medium" });
  } else if (uniqueSuppDays2 >= 6 && takenToday > 0) {
    insights.push({ category: "supplements", icon: "✅", headline: "Supplements-Tracking aktiv", detail: uniqueSuppDays2 + " von 7 Tagen. " + takenToday + "/" + supplementList2.length + " heute eingenommen.", priority: "low" });
  }

  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  insights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  return insights;
}

export async function GET() {
  const data = await getData();
  const { scores, total } = score(data);
  const insights = generateInsights(data, scores);

  // Data freshness — how old is the most recent entry per category?
  const now = getBerlinDate();
  const todayStr = now.toISOString().split("T")[0];
  const dataAge: Record<string, number | null> = {};
  const categories = [
    { key: "sleep", entries: data.sleep?.entries || [], dateField: "date" },
    { key: "mood", entries: data.mood?.entries || [], dateField: "date" },
    { key: "gym", entries: data.gym?.logs || [], dateField: "logs" },
    { key: "habits", entries: Object.keys(data.habits?.habits || {}), dateField: "habits" },
    { key: "water", entries: data.water?.entries || [], dateField: "date" },
    { key: "meals", entries: data.meals?.entries || [], dateField: "date" },
    { key: "weight", entries: data.weight?.entries || [], dateField: "date" },
    { key: "supplements", entries: data.supplements?.log || [], dateField: "log" },
  ];
  for (const cat of categories) {
    let lastEntry: string | null = null;
    if (cat.key === "gym") {
      const logs = data.gym?.logs || [];
      if (logs.length > 0) lastEntry = [...logs].sort().pop()!;
    } else if (cat.key === "habits") {
      const habitsMap = data.habits?.habits || {};
      const dates = Object.keys(habitsMap).sort().reverse();
      if (dates.length > 0) {
        const lastDate = dates[0];
        const hasData = Object.values(habitsMap[lastDate] || {}).some(Boolean);
        if (hasData) lastEntry = lastDate;
      }
    } else {
      const entries = cat.entries as any[];
      if (entries.length > 0) lastEntry = entries[0]?.date || null;
    }
    if (lastEntry) {
      const parsed = parseBerlinDate(lastEntry);
      dataAge[cat.key] = daysBetween(parsed, now);
    } else {
      dataAge[cat.key] = null;
    }
  }

  return NextResponse.json({ score: total, breakdown: scores, insights, dataAge, generatedAt: new Date().toISOString() });
}
