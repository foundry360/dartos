import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  DANIEL_TURN_CACHE_GENERATION,
  LOCAL_SAY_CACHE_DIR,
  LOCAL_SAY_TURN_RATE,
  LOCAL_SAY_TURN_VOICE,
} from "@/lib/local-say/env";

const memoryCache = new Map<string, Buffer>();

export function buildLocalSayCacheKey(text: string): string {
  const material = `${DANIEL_TURN_CACHE_GENERATION}:${LOCAL_SAY_TURN_VOICE}:${LOCAL_SAY_TURN_RATE}:${text}`;
  return createHash("sha256").update(material).digest("hex");
}

function getCachePath(cacheKey: string): string {
  return path.join(LOCAL_SAY_CACHE_DIR, `${cacheKey}.wav`);
}

export function getCachedLocalSay(cacheKey: string): Buffer | null {
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const filePath = getCachePath(cacheKey);
  if (!existsSync(filePath)) {
    return null;
  }

  const audio = readFileSync(filePath);
  memoryCache.set(cacheKey, audio);
  return audio;
}

export function cacheLocalSay(cacheKey: string, audio: Buffer): void {
  memoryCache.set(cacheKey, audio);
  mkdirSync(LOCAL_SAY_CACHE_DIR, { recursive: true });
  writeFileSync(getCachePath(cacheKey), audio);
}
