import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

export async function GET() {
  const keys = ["bucketlist", "finance", "gym", "habits", "meals", "mood", "pushups", "sleep", "streaks", "supplements", "water", "weight", "wellness"];
  const result: Record<string, any> = { exportedAt: new Date().toISOString(), version: "1.2" };
  for (const key of keys) {
    const data = await storage.get(key);
    if (data !== null) result[key] = data;
  }
  return NextResponse.json(result, {
    headers: { "Content-Disposition": `attachment; filename="life-tracker-backup-${new Date().toISOString().split("T")[0]}.json"` },
  });
}
