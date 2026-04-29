import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

function averageGap(logs: string[]): number {
  if (logs.length < 2) return 5;
  const sorted = [...logs].sort();
  let total = 0;
  for (let i = 1; i < sorted.length; i++) total += (new Date(sorted[i]).getTime() - new Date(sorted[i-1]).getTime()) / 86400000;
  return Math.round(total / (sorted.length - 1));
}

export async function GET() {
  const [gym, habitsRaw] = await Promise.all([storage.get("gym"), storage.get("habits")]);
  const logs: string[] = gym?.logs || [];
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const lastSession = logs.length > 0 ? [...logs].sort().pop()! : null;
  const gapDays = lastSession ? Math.round((today.getTime() - new Date(lastSession).getTime()) / 86400000) : null;
  const avgGap = averageGap(logs);
  const totalSessions = logs.length;
  // habits.json new format: entries[] not habits{}. Use entries[] to find today's completed habits
  const todayHabitsEntry = (habitsRaw?.entries || []).find((e: any) => e.date === todayStr);
  const todayCompletedIds = new Set(todayHabitsEntry?.completed || []);
  const gymDoneToday = todayCompletedIds.has("gym");

  let streak = 0;
  let check = new Date(today);
  while (logs.includes(check.toISOString().split("T")[0])) { streak++; check.setDate(check.getDate() - 1); }
  if (streak === 0) { const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1); check = new Date(yesterday); while (logs.includes(check.toISOString().split("T")[0])) { streak++; check.setDate(check.getDate() - 1); } }

  const longestStreak = (() => { if (logs.length === 0) return 0; const sorted = [...logs].sort(); let best = 1, current = 1; for (let i = 1; i < sorted.length; i++) { const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i-1]).getTime()) / 86400000; if (Math.round(diff) === 1) { current++; best = Math.max(best, current); } else current = 1; } return best; })();

  const thisMonth = today.toISOString().slice(0, 7);
  const monthLogs = logs.filter(l => l.startsWith(thisMonth));
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);
  const lastMonthLogs = logs.filter(l => l.startsWith(lastMonth));

  const motivation = streak > 0 ? `🔥 ${streak}-day streak! Keep it going.` : gapDays !== null && gapDays >= 5 ? `🏋️ ${gapDays} days since last session. Comeback plan ready — let's go!` : `💪 Last session ${gapDays} days ago. You're due soon.`;
  const comebackPlan = gapDays !== null && gapDays >= 4 ? { phase: gapDays >= 14 ? "restart" : "rebuild", targetSessions: gapDays >= 14 ? 2 : 3, targetWeeks: gapDays >= 14 ? 3 : 2, focus: gapDays >= 14 ? "Light start — full body, lower weight, rebuild the habit first." : "Build momentum — aim for your usual ~5 day rhythm.", tip: `Your average is every ${avgGap} days across ${totalSessions} total sessions.` } : null;

  return NextResponse.json({ lastSession, gapDays, avgGapDays: avgGap, totalSessions, currentStreak: streak, longestStreak, gymDoneToday, thisMonthSessions: monthLogs.length, lastMonthSessions: lastMonthLogs.length, motivation, comebackPlan, status: streak > 0 ? "active" : gapDays !== null && gapDays >= 5 ? "comeback_needed" : "on_track" });
}
