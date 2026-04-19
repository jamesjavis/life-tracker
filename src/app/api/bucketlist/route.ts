import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

const DEFAULT_DATA = {
  items: [
    { id: "1", text: "1M Euro Net Worth", target: "€1M", icon: "💰", completed: false },
    { id: "2", text: "Funding received (€12K/mo)", target: "€12K/mo", icon: "🎯", completed: false },
    { id: "3", text: "Successful app launch", target: "Launch", icon: "🚀", completed: false },
    { id: "4", text: "Fitness goals achieved", target: "Fit", icon: "💪", completed: false },
    { id: "5", text: "eWorld Record game live", target: "Game", icon: "🎮", completed: false },
  ]
};

// GET /api/bucketlist
export async function GET() {
  const data = (await storage.get("bucketlist")) ?? DEFAULT_DATA;
  return NextResponse.json(data);
}

// POST /api/bucketlist
export async function POST(req: Request) {
  const { id, action, text, target, icon, category, notes } = await req.json();
  const data = (await storage.get("bucketlist")) ?? DEFAULT_DATA;

  if (action === "toggle" && id) {
    const item = data.items.find((i: any) => i.id === id);
    if (item) item.completed = !item.completed;
  } else if (action === "add" && text) {
    data.items.push({ id: Date.now().toString(), text, target: target || "", icon: icon || "🎯", completed: false, category: category || "other", notes: notes || "" });
  } else if (action === "remove" && id) {
    data.items = data.items.filter((i: any) => i.id !== id);
  }
  await storage.set("bucketlist", data);
  return NextResponse.json({ success: true, items: data.items });
}
