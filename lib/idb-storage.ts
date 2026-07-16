import type { PersistStorage, StorageValue } from "zustand/middleware";

const DB_NAME = "offline-chat-db";
const STORE_NAME = "zustand";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB."));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    };
  });
}

export function createIndexedDbStorage<T>(): PersistStorage<T> {
  return {
    getItem: async (name) => {
      if (typeof window === "undefined") {
        return null;
      }

      try {
        const value = await withStore<string | undefined>("readonly", (store) => store.get(name));
        return value ? (JSON.parse(value) as StorageValue<T>) : null;
      } catch (error) {
        console.error("Failed to read local app data.", error);
        return null;
      }
    },
    setItem: async (name, value) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        await withStore<IDBValidKey>("readwrite", (store) => store.put(JSON.stringify(value), name));
      } catch (error) {
        console.error("Failed to save local app data.", error);
      }
    },
    removeItem: async (name) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        await withStore<undefined>("readwrite", (store) => store.delete(name));
      } catch (error) {
        console.error("Failed to remove local app data.", error);
      }
    }
  };
}
