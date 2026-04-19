import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  const [wellness, meditation, breathing] = await Promise.all([storage.get("wellness"), storage.get("meditation"), storage.get("breathing")]);
  const today = new Date().toISOString().split("T")[0];
  const medEntries = meditation?.entries || [];
  const todayMed = medEntries.find((e: any) => e.date === today);
  const last7Med = medEntries.slice(-7);
  const avgMedMin = last7Med.length > 0 ? Math.round(last7Med.reduce((s: number, e: any) => s + (e.minutes || 0), 0) / last7Med.length) : 0;
  const wellData = wellness ?? {};
  const screenEntries = wellData.screenTime?.entries || [];
  const todayST = screenEntries.find((e: any) => e.date === today);
  const last7ST = screenEntries.slice(-7);
  const avgScreen = last7ST.length > 0 ? Math.round(last7ST.reduce((s: number, e: any) => s + (e.minutes || 0), 0) / last7ST.length) : 0;
  const breathingSessions = breathing?.sessions || [];
  const todayBreath = breathingSessions.filter((s: any) => s.date === today);
  const last7Breath = breathingSessions.slice(-7);
  const avgBreathMin = last7Breath.length > 0 ? Math.round(last7Breath.reduce((s: number, e: any) => s + (e.duration || 0), 0) / 60 / last7Breath.length) : 0;
  const meditationScore = Math.min(avgMedMin / 15, 1) * 50;
  const screenScore = avgScreen < 120 ? Math.max(0, (1 - avgScreen / 120) * 30) : 0;
  const breathingScore = Math.min(avgBreathMin / 10, 1) * 20;
  const total = Math.round(meditationScore + screenScore + breathingScore);
  return NextResponse.json({ total, breakdown: { meditation: Math.round(meditationScore), screen: Math.round(screenScore), breathing: Math.round(breathingScore) }, today: { meditation: todayMed ? (todayMed.minutes || 0) : 0, screen: todayST?.minutes || 0, breathing: todayBreath.reduce((s: number, e: any) => s + (e.duration || 0), 0) }, avgs: { meditation: avgMedMin, screen: avgScreen, breathing: avgBreathMin } });
}
