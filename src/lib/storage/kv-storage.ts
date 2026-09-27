import { createMMKV, type MMKV } from 'react-native-mmkv';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * Synchronous on-device key/value storage (MMKV). Writes are durable as soon as `set` returns,
 * which is what lets the outbox persist a message before treating it as queued.
 * Under Jest, react-native-mmkv transparently returns an in-memory instance.
 */
export function createKvStorage(id: string): MMKV {
  return createMMKV({ id });
}

/** Zustand `persist` adapter over an MMKV instance (synchronous hydrate and writes). */
export function zustandStorage(mmkv: MMKV) {
  const storage: StateStorage = {
    getItem: (name) => mmkv.getString(name) ?? null,
    setItem: (name, value) => mmkv.set(name, value),
    removeItem: (name) => {
      mmkv.remove(name);
    },
  };
  return createJSONStorage(() => storage);
}

export function readJson<T>(mmkv: MMKV, key: string): T | undefined {
  const raw = mmkv.getString(key);
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function writeJson(mmkv: MMKV, key: string, value: unknown): void {
  mmkv.set(key, JSON.stringify(value));
}
