import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";
import { berlinDateStr } from "@/lib/date";

export async function GET() {
  const [sleep, mood, habits, finance, gym, water, weight, wellness, meals, supplements, pushups] = await Promise.all([
    storage.get("sleep"), storage.get("mood"), storage.get("habits"), storage.get("finance"),
    storage.get("gym"), storage.get("water"), storage.get("weight"), storage.get("wellness"), storage.get("meals"),
    storage.get("supplements"), storage.get("pushups")
  ]);
  const today = berlinDateStr();
  const checks = [
    { label: "Sleep", data: sleep?.entries || [], staleThreshold: 3 },
    { label: "Mood", data: mood?.entries || [], staleThreshold: 3 },
    { label: "Habits", data: habits?.habits || {}, staleThreshold: 3 },
    { label: "Finance", data: finance, staleThreshold: 7 },
    { label: "Gym", data: gym?.logs || [], staleThreshold: 3 },
    { label: "Water", data: water?.entries || [], staleThreshold: 3 },
    { label: "Weight", data: weight?.entries || [], staleThreshold: 14 },
    { label: "Meals", data: meals?.entries || [], staleThreshold: 7 },
    { label: "Supplements", data: supplements?.log || [], staleThreshold: 3, total: supplements?.supplements?.length ?? 0 },
    { label: "Pushups", data: pushups?.entries || [], staleThreshold: 3 },
  ];
  const results = checks.map(({ label, data: d, staleThreshold, total: totalCount }) => {
    let lastDate: string | null = null;
    let gap: number | null = null;
    if (Array.isArray(d) && d.length > 0) {
      const sorted = [...d].sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
      lastDate = sorted[0]?.date || null;
    } else if (d && typeof d === "object" && !Array.isArray(d)) {
      const keys = Object.keys(d).filter(k => k !== "lastUpdated" && k !== "goals" && k !== "supplements" && k !== "log");
      if (keys.length > 0) lastDate = keys.sort().reverse()[0] || null;
    }
    if (lastDate) gap = Math.floor((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000);
    return { label, lastDate, daysAgo: gap, status: gap !== null && gap > staleThreshold ? "stale" : "ok", total: totalCount ?? null };
  });
  return NextResponse.json({ generated: today, summary: { total: results.length, healthy: results.filter(r => r.status === "ok").length, stale: results.filter(r => r.status === "stale").length }, dataFiles: results });
}
