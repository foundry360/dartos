const DB_NAME = "dartos-tts";
const DB_VERSION = 2;
const STORE_NAME = "phrases";
const CACHE_GENERATION_KEY = "dartos-tts-cache-generation";

const memoryCache = new Map<string, Blob>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error("Unable to open TTS cache"));
    };

    request.onupgradeneeded = () => {
      const database = request.result;
      if (database.objectStoreNames.contains(STORE_NAME)) {
        database.deleteObjectStore(STORE_NAME);
      }
      database.createObjectStore(STORE_NAME);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

async function readPhraseBlob(cacheKey: string): Promise<Blob | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return null;
  }

  try {
    const database = await openDatabase();

    return await new Promise<Blob | null>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(cacheKey);

      request.onerror = () => {
        reject(request.error ?? new Error("Unable to read TTS cache"));
      };

      request.onsuccess = () => {
        const value = request.result;
        resolve(value instanceof Blob ? value : null);
      };

      transaction.oncomplete = () => {
        database.close();
      };
    });
  } catch {
    return null;
  }
}

async function deletePhraseBlob(cacheKey: string): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  try {
    const database = await openDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(cacheKey);

      request.onerror = () => {
        reject(request.error ?? new Error("Unable to delete TTS cache entry"));
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        database.close();
      };
    });
  } catch {
    // Ignore cache delete failures.
  }
}

async function writePhraseBlob(cacheKey: string, blob: Blob): Promise<void> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  try {
    const database = await openDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, cacheKey);

      request.onerror = () => {
        reject(request.error ?? new Error("Unable to write TTS cache"));
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        database.close();
      };
    });
  } catch {
    // Ignore cache write failures.
  }
}

export async function clearTtsCache(): Promise<void> {
  memoryCache.clear();

  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return;
  }

  try {
    const database = await openDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onerror = () => {
        reject(request.error ?? new Error("Unable to clear TTS cache"));
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        database.close();
      };
    });
  } catch {
    // Ignore cache clear failures.
  }
}

export async function ensureTtsCacheGeneration(cacheGeneration: string): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  const storedGeneration = window.localStorage.getItem(CACHE_GENERATION_KEY);
  if (storedGeneration === cacheGeneration) {
    return;
  }

  await clearTtsCache();
  window.localStorage.setItem(CACHE_GENERATION_KEY, cacheGeneration);
}

export async function isGeminiVoiceBlob(blob: Blob): Promise<boolean> {
  if (blob.type === "audio/mpeg" || blob.type === "audio/mp3") {
    return false;
  }

  const header = await blob.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(header);

  if (bytes.length < 12) {
    return false;
  }

  const isRiff =
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46;
  const isWave =
    bytes[8] === 0x57 &&
    bytes[9] === 0x41 &&
    bytes[10] === 0x56 &&
    bytes[11] === 0x45;

  return isRiff && isWave;
}

export function normalizeGeminiWavBlob(blob: Blob): Blob {
  return new Blob([blob], { type: "audio/wav" });
}

export async function getCachedPhraseAudio(cacheKey: string): Promise<Blob | null> {
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    if (await isGeminiVoiceBlob(cached)) {
      return cached;
    }

    memoryCache.delete(cacheKey);
  }

  const persisted = await readPhraseBlob(cacheKey);
  if (!persisted) {
    return null;
  }

  if (await isGeminiVoiceBlob(persisted)) {
    memoryCache.set(cacheKey, persisted);
    return persisted;
  }

  await deletePhraseBlob(cacheKey);
  return null;
}

export async function cachePhraseAudio(cacheKey: string, blob: Blob): Promise<void> {
  const normalized = normalizeGeminiWavBlob(blob);
  memoryCache.set(cacheKey, normalized);
  await writePhraseBlob(cacheKey, normalized);
}
