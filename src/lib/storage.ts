/**
 * Storage abstraction — local fs for dev, Upstash Redis for Vercel production.
 * Usage: import { storage } from "@/lib/storage";
 *   const data = await storage.get("sleep");
 *   await storage.set("sleep", data);
 */
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
  : null;

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function localRead(filename: string): any {
  const filePath = path.join(DATA_DIR, `${filename}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function localWrite(filename: string, data: any): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, `${filename}.json`), JSON.stringify(data, null, 2));
}

export const storage = {
  async get(key: string): Promise<any | null> {
    if (redis) {
      const raw = await redis.get<any>(key);
      return raw ?? null;
    } else {
      return localRead(key);
    }
  },
  async set(key: string, data: any): Promise<void> {
    if (redis) {
      await redis.set(key, JSON.stringify(data));
    } else {
      localWrite(key, data);
    }
  },
  async patch(key: string, updater: (current: any) => any): Promise<any> {
    const current = (await this.get(key)) ?? {};
    const next = updater(current);
    await this.set(key, next);
    return next;
  },
};
