import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dataDir = path.join(process.cwd(), "data");
  
  // Collect all data files
  const response: Record<string, any> = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
  };

  const files = ["gym.json", "habits.json", "streaks.json", "bucketlist.json"];
  
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