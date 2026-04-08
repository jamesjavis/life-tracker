import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "bucketlist.json");

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readData() {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {
      items: [
        { id: "1", text: "1M Euro Net Worth", target: "€1M", icon: "💰", completed: false },
        { id: "2", text: "Funding received (€12K/mo)", target: "€12K/mo", icon: "🎯", completed: false },
        { id: "3", text: "Successful app launch", target: "Launch", icon: "🚀", completed: false },
        { id: "4", text: "Fitness goals achieved", target: "Fit", icon: "💪", completed: false },
        { id: "5", text: "eWorld Record game live", target: "Game", icon: "🎮", completed: false },
      ]
    };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

function writeData(data: any) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// GET /api/bucketlist - Get all bucket list items
export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

// POST /api/bucketlist - Add or toggle bucket list item
export async function POST(req: Request) {
  const { id, action, text, target, icon, category, notes } = await req.json();
  const data = readData();

  if (action === "toggle" && id) {
    const item = data.items.find((i: any) => i.id === id);
    if (item) item.completed = !item.completed;
  } else if (action === "add" && text) {
    data.items.push({
      id: Date.now().toString(),
      text,
      target: target || "",
      icon: icon || "🎯",
      completed: false,
      category: category || "other",
      notes: notes || "",
    });
  } else if (action === "remove" && id) {
    data.items = data.items.filter((i: any) => i.id !== id);
  }

  writeData(data);
  return NextResponse.json({ success: true, items: data.items });
}