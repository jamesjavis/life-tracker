import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dataDir = path.join(process.cwd(), "data");
  
  // All tracked data files
  const files = [
    "bucketlist.json",
    "finance.json",
    "gym.json",
    "habits.json",
    "meals.json",
    "mood.json",
    "pushups.json",
    "sleep.json",
    "streaks.json",
    "supplements.json",
    "water.json",
    "weight.json",
    "wellness.json",
  ];
  
  const response: Record<string, any> = {
    exportedAt: new Date().toISOString(),
    version: "1.1",
  };

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const key = file.replace(".json", "");
        response[key] = JSON.parse(content);
      } catch (e) {
        response[file] = { error: "Failed to parse" };
      }
    }
  }

  return NextResponse.json(response, {
    headers: {
      "Content-Disposition": `attachment; filename="life-tracker-backup-${new Date().toISOString().split("T")[0]}.json"`,
    },
  });
}