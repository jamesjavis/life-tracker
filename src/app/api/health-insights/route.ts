import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { berlinDateStr, berlinNow } from "@/lib/date";

async function getData() {
  const [sleep, mood, gym, habits, water, meals, weight, supplements, pushups, breathing] = await Promise.all([
    storage.get("sleep"),
    storage.get("mood"),
    storage.get("gym"),
    storage.get("habits"),
    storage.get("water"),
    storage.get("meals"),
    storage.get("weight"),
    storage.get("supplements"),
    storage.get("pushups"),
    storage.get("breathing"),
  ]);
  return { sleep, mood, gym, habits, water, meals, weight, supplements, pushups, breathing };
}

function score(data: any) {
  const scores: Record<string, number> = {};
  let total = 0;
  const sleepEntries = data.sleep?.entries || [];
  const last7sleep = sleepEntries.slice(-7);
  const avgSleep = last7sleep.length > 0 ? last7sleep.reduce((a: number, b: any) => a + (b.duration || b.hours || 0), 0) / last7sleep.length : 0;
  const sleepQuality = last7sleep.length > 0 ? last7sleep.reduce((s: number, e: any) => s + (e.quality || 0), 0) / last7sleep.length : 0;
  scores.sleep = Math.round(Math.min(avgSleep / 8, 1) * 12.5 + Math.min(sleepQuality / 10, 1) * 12.5);
  total += 25;
  const moodEntries = data.mood?.entries || [];
  const last7mood = moodEntries.slice(-7);
  const avgMood = last7mood.length > 0 ? last7mood.reduce((s: number, e: any) => s + (e.mood || 0), 0) / last7mood.length : 0;
  const avgEnergy = last7mood.length > 0 ? last7mood.reduce((s: number, e: any) => s + (e.energy || 0), 0) / last7mood.length : 0;
  scores.mood = Math.round(Math.min(avgMood / 8, 1) * 10 + Math.min(avgEnergy / 8, 1) * 10);
  total += 20;
  const gymLogs: string[] = data.gym?.logs || [];
  const now = berlinNow();
  let gymDaysLast14: string[] = [];
  for (let i = 0; i < 14; i++) { const d = new Date(now); d.setDate(d.getDate() - i); if (gymLogs.includes(d.toISOString().split("T")[0])) gymDaysLast14.push(d.toISOString().split("T")[0]); }
  scores.gym = Math.round(Math.min(gymDaysLast14.length / 6, 1) * 25);
  total += 25;
  const HABIT_IDS = ["yoga", "meditation", "gym", "bauchworkout", "lesen", "creatin", "pushups", "atem", "smoothie"];
  const HABIT_WITHOUT_HABITS_FILE = ["pushups"];
  const habitsEntries = data.habits?.entries || [];
  const pushupsEntries = (data as any).pushups?.entries || [];
  const today = berlinDateStr();
  const todayHabitEntry = habitsEntries.find((e: any) => e.date === today);
  const completedIds = new Set(todayHabitEntry?.completed || []);
  const pushupsDoneToday = pushupsEntries.some((e: any) => e.date === today);
  let habitScore = 0;
  const done = HABIT_IDS.filter(id => {
    if (HABIT_WITHOUT_HABITS_FILE.includes(id)) return id === "pushups" && pushupsDoneToday;
    return completedIds.has(id);
  }).length;
  habitScore = Math.min(done / 9, 1) * 15;
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
  const supplementList = data.supplements?.supplements || [];
  const supplementLog = data.supplements?.log || [];
  const supplementEntries = data.supplements?.entries || [];
  const now2 = berlinNow();
  let totalEntriesTaken = 0;
  if (supplementEntries.length > 0) {
    const last7entries = supplementEntries.filter((e: any) => {
      const d = new Date(e.date);
      return (now2.getTime() - d.getTime()) / 86400000 <= 7;
    });
    totalEntriesTaken = last7entries.reduce((s: number, e: any) => s + (e.taken?.length || 0), 0);
  } else {
    const last7supps = supplementLog.filter((e: any) => {
      const d = new Date(e.date);
      return (now2.getTime() - d.getTime()) / 86400000 <= 7;
    });
    totalEntriesTaken = last7supps.length;
  }
  const maxPossibleEntries = supplementList.length * 7;
  scores.supplements = maxPossibleEntries > 0 ? Math.round(Math.min(totalEntriesTaken / maxPossibleEntries, 1) * 10) : 0;
  total += 10;
  return { scores, total: Object.values(scores).reduce((a, b) => a + b, 0) };
}

function getBerlinDate() { return berlinNow(); }
function parseBerlinDate(dateStr: string) { const [y, m, d] = dateStr.split("-").map(Number); return new Date(y, m - 1, d, 0, 0, 0, 0); }
function formatBerlinDate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function daysBetween(date: Date, now: Date) { return Math.floor((now.getTime() - date.getTime()) / 86400000); }

function generateInsights(data: any, scores: Record<string, number>) {
  const insights: any[] = [];
  const now = getBerlinDate();
  const todayStr = berlinDateStr();

  const sleepEntries = data.sleep?.entries || [];
  const last7sleep = sleepEntries.slice(-7);
  const avgSleep = last7sleep.length > 0 ? last7sleep.reduce((s: number, e: any) => s + (e.duration || e.hours || 0), 0) / last7sleep.length : 0;
  const lastSleepEntry = sleepEntries[sleepEntries.length - 1];
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
  const last7mood = moodEntries.slice(-7);
  const avgMood2 = last7mood.length > 0 ? last7mood.reduce((s: number, e: any) => s + (e.mood || 0), 0) / last7mood.length : 0;
  const avgEnergy2 = last7mood.length > 0 ? last7mood.reduce((s: number, e: any) => s + (e.energy || 0), 0) / last7mood.length : 0;
  const lastMoodEntry = moodEntries[moodEntries.length - 1];
  const daysSinceMood = lastMoodEntry ? daysBetween(parseBerlinDate(lastMoodEntry.date), now) : null;

  if (daysSinceMood === null || daysSinceMood >= 7) {
    insights.push({ category: "mood", icon: "💭", headline: "Mood-Tracking wieder aufnehmen", detail: `${daysSinceMood === null ? "Noch nie getrackt" : `${daysSinceMood} Tage keine Daten`}. Tägliche Check-ins zeigen Muster.`, priority: "high" });
  } else if (avgEnergy2 < 5) {
    insights.push({ category: "energy", icon: "🔋", headline: "Energy niedrig – drei Hebel", detail: `Ø Energy ${avgEnergy2.toFixed(1)}/10. Bewegung > Schlaf > Supplements.`, priority: "high" });
  } else if (avgMood2 >= 7 && avgEnergy2 >= 7) {
    insights.push({ category: "mood", icon: "😊", headline: "Stimmung & Energy gut", detail: `Ø Mood ${avgMood2.toFixed(1)}/10, Energy ${avgEnergy2.toFixed(1)}/10. Weiter diesen Kurs halten.`, priority: "low" });
  }

  const habitsEntries = data.habits?.entries || [];
  const pushupsEntries = data.pushups?.entries || [];
  const todayHabitEntry = habitsEntries.find((e: any) => e.date === todayStr);
  const completedToday = new Set(todayHabitEntry?.completed || []);
  const pushupsDoneToday = pushupsEntries.some((e: any) => e.date === todayStr);
  const doneToday = [...completedToday].filter(id => id !== "pushups").length + (pushupsDoneToday ? 1 : 0);
  const yesterday = new Date(now.getTime() - 86400000);
  const yesterdayStr = formatBerlinDate(yesterday);
  const yesterdayHabitEntry = habitsEntries.find((e: any) => e.date === yesterdayStr);
  const completedYesterday = new Set(yesterdayHabitEntry?.completed || []);
  const pushupsDoneYesterday = pushupsEntries.some((e: any) => e.date === yesterdayStr);
  const doneYesterday = [...completedYesterday].filter(id => id !== "pushups").length + (pushupsDoneYesterday ? 1 : 0);

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

  const breathingSessions = data.breathing?.sessions || [];
  const lastBreathing = breathingSessions.length > 0 ? breathingSessions[0] : null;
  const daysSinceBreathing = lastBreathing ? daysBetween(parseBerlinDate(lastBreathing.date), now) : null;
  const last7daysBreathing = breathingSessions.filter((s: any) => {
    const d = parseBerlinDate(s.date);
    return (now.getTime() - d.getTime()) / 86400000 <= 7;
  });

  if (daysSinceBreathing === null || daysSinceBreathing >= 7) {
    insights.push({ category: "breathing", icon: "🌬️", headline: "Atemübungen wieder aufnehmen", detail: `${daysSinceBreathing === null ? "Noch nie getrackt" : `Letzte Sitzung vor ${daysSinceBreathing} Tagen`}. 5 Min/Tag senken Cortisol messbar.`, priority: "medium" });
  } else if (last7daysBreathing.length >= 5) {
    insights.push({ category: "breathing", icon: "✅", headline: "Atem-Tracking aktiv", detail: `${last7daysBreathing.length} Sitzungen in 7 Tagen.`, priority: "low" });
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

  const supplementList2 = data.supplements?.supplements || [];
  const supplementLog2 = data.supplements?.log || [];
  const supplementEntries2 = data.supplements?.entries || [];
  const now3 = getBerlinDate();
  const today3 = berlinDateStr();
  let takenToday: number, lastSuppEntry: any, uniqueSuppDays2: number, last7supps2: any[];
  if (supplementEntries2.length > 0) {
    const todayEntry = supplementEntries2.find((e: any) => e.date === today3);
    takenToday = todayEntry?.taken?.length || 0;
    const lastEntry = supplementEntries2[supplementEntries2.length - 1];
    lastSuppEntry = lastEntry ? { date: lastEntry.date } : null;
    last7supps2 = supplementEntries2.filter((e: any) => {
      const d = new Date(e.date);
      return (now3.getTime() - d.getTime()) / 86400000 <= 7;
    });
    uniqueSuppDays2 = new Set(last7supps2.map((e: any) => e.date)).size;
  } else {
    last7supps2 = supplementLog2.filter((e: any) => {
      const d = new Date(e.date);
      return (now3.getTime() - d.getTime()) / 86400000 <= 7;
    });
    uniqueSuppDays2 = new Set(last7supps2.map((e: any) => e.date)).size;
    takenToday = supplementLog2.filter((e: any) => e.date === today3).length;
    lastSuppEntry = supplementLog2.length > 0 ? supplementLog2[supplementLog2.length - 1] : null;
  }
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
  const now = getBerlinDate();
  const todayStr = berlinDateStr();
  const dataAge: Record<string, number | null> = {};
  const categories = [
    { key: "sleep", entries: data.sleep?.entries || [] },
    { key: "mood", entries: data.mood?.entries || [] },
    { key: "gym", entries: data.gym?.logs || [] },
    { key: "habits", entries: data.habits?.entries || [] },
    { key: "water", entries: data.water?.entries || [] },
    { key: "meals", entries: data.meals?.entries || [] },
    { key: "weight", entries: data.weight?.entries || [] },
    { key: "supplements", entries: data.supplements?.entries || data.supplements?.log || [] },
    { key: "breathing", entries: data.breathing?.sessions || [] },
  ];
  for (const cat of categories) {
    let lastEntry: string | null = null;
    if (cat.key === "gym") {
      const logs = cat.entries as string[];
      if (logs.length > 0) lastEntry = [...logs].sort().pop()!;
    } else if (cat.key === "habits") {
      const habitsEntries4age = cat.entries as any[];
      const habitsDates = new Set(habitsEntries4age.map((e: any) => e.date));
      const pushupsEntries = data.pushups?.entries || [];
      const pushupsDates = pushupsEntries.map((e: any) => e.date).sort().reverse();
      const latestFromHabits = [...habitsDates].sort().pop() || null;
      const latestFromPushups = pushupsDates[0] || null;
      if (latestFromHabits && latestFromPushups) lastEntry = latestFromHabits >= latestFromPushups ? latestFromHabits : latestFromPushups;
      else lastEntry = latestFromHabits || latestFromPushups;
    } else {
      const entries = cat.entries as any[];
      if (entries.length > 0) lastEntry = entries[entries.length - 1]?.date || null;
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
