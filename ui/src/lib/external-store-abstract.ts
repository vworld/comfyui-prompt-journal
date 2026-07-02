export type ExternalStoreListener = () => void;

export abstract class ExternalStoreAbstract<T> {
  private data: T;
  private listeners = new Set<ExternalStoreListener>();

  constructor(initialData: T) {
    this.data = initialData;
  }
  private notify() {
    this.listeners.forEach((l) => l());
  }

  private ensureNewSnapshot(data: T): T {
    return Object.is(this.data, data) ? structuredClone(data) : data;
  }

  getState() {
    return this.data;
  }

  /**
   * The provided data object does not need to be a new object.
   * The store always ensures that the published state is a new snapshot.
   * Note: uses `structuredClone` to ensure immutability of the data.
   */
  setState(data: T) {
    this.data = this.ensureNewSnapshot(data);
    this.notify();
  }

  /**
   * The updater does not need to return a new object.
   * The store always ensures that the published state is a new snapshot.
   * Note: uses `structuredClone` to ensure immutability of the data.
   *
   * To skip cloning use the `clone` flag
   * When `clone` is false, the updater gets the original
   * state object and must itself return a new one.
   */
  update(updater: (data: T) => T, clone = true) {
    const data = clone ? structuredClone(this.data) : this.data;
    const newData = updater(data);
    this.data = clone ? this.ensureNewSnapshot(newData) : newData;
    this.notify();
  }

  subscribe(listener: ExternalStoreListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
