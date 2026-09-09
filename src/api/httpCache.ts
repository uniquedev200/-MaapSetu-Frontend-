// Lightweight IndexedDB read-through cache for GET responses.
//
// Browsers cannot run SQLite, so we keep cached copies of the API payloads the
// app renders in memory-backed IndexedDB instead. List/details pages hydrate
// instantly from cache and keep rendering on a slow/offline network. Writes
// (POST/PATCH) invalidate by prefix so stale data never lingers.

const DB_NAME = 'maapsetu-cache';
const STORE = 'http-cache';
const DB_VERSION = 1;

export const CACHEABLE_METHODS = ['GET'];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export type CacheEntry<T = unknown> = {
  key: string;
  data: T;
  savedAt: number;
};

function cacheKey(url: string): string {
  return url;
}

export async function cacheGet<T>(url: string): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(cacheKey(url));
      req.onsuccess = () => {
        const entry: CacheEntry<T> | undefined = req.result;
        resolve(entry?.data ?? null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function cachePut(url: string, data: unknown): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ key: cacheKey(url), data, savedAt: Date.now() } as CacheEntry);
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* cache best-effort only */
  }
}

export async function cacheDeletePrefix(prefix: string): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const req = store.openCursor();
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        if (cursor.key.toString().startsWith(prefix)) cursor.delete();
        cursor.continue();
      }
    };
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* cache best-effort only */
  }
}

export async function cacheClear(): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* cache best-effort only */
  }
}