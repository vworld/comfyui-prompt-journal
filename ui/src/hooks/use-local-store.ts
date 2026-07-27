export interface StorageAdapter<T> {
  load(): T | null;
  save(value: T): void;
  remove(): void;
}

export function createLocalStorage<T>(key: string): StorageAdapter<T> {
  return {
    load() {
      try {
        const value = localStorage.getItem(key);
        return value ? (JSON.parse(value) as T) : null;
      } catch {
        return null;
      }
    },

    save(value: T) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // ignore
      }
    },

    remove() {
      localStorage.removeItem(key);
    },
  };
}
