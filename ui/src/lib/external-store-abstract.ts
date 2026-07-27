export type ExternalStoreListener = () => void;

/**
 * ⚠️ REMINDER — read before touching or extending this class.
 *
 * This store guarantees identity-based change detection for
 * `useSyncExternalStore` (new reference in ⇒ new reference published),
 * nothing more. It does NOT do structural diffing. That has consequences
 * that are easy to forget mid-refactor:
 *
 * 1. THE GUARD IS REFERENCE-ONLY, NOT DEEP.
 *    `ensureNewSnapshot` only checks whether the top-level object you hand
 *    it is the exact same reference as last time. A shallow copy defeats
 *    it silently:
 *
 *      const draft = { ...this.data };   // new top-level ref — guard passes
 *      draft.panes.push(x);              // but draft.panes IS the old array,
 *      this.setState(draft);             // now mutated in a published snapshot
 *
 *    Rule: either mutate `this.data` in place and hand back the SAME
 *    reference (triggers the clone), or construct a value that is fully
 *    decoupled from the previous one yourself. There is no partial credit.
 *
 * 2. WHEN THE FALLBACK CLONE FIRES, EVERY NESTED OBJECT GETS A NEW IDENTITY.
 *    `structuredClone` is a full deep clone — it does not preserve identity
 *    for unchanged children. Any `useMemo`/`React.memo` a consumer keys on
 *    a nested value (e.g. a single pane) will invalidate on every commit,
 *    changed or not. This is a real cost, not a free safety net — it's
 *    fine at small state sizes, and stops being fine if this class ever
 *    gets reused for something large or high-frequency. Don't reuse this
 *    class for that without revisiting this.
 *
 * 3. `getState()`'s RETURN VALUE IS A SNAPSHOT, NOT A LIVE BINDING.
 *    Read it and use it immediately. Don't hold a reference to it across
 *    a later mutating call and expect it to still describe that earlier
 *    moment — nothing enforces that for you.
 *
 * 4. Listeners can only be state level, no key based subscription is supported.
 *
 * If a subclass's mutation pattern gets broader than "mutate one small,
 * known shape in place, then commit" — this class is the wrong tool.
 * Reach for something that tracks writes for you (e.g. Immer/mutative or a reducer)
 * rather than trying to patch diffing logic into this class.
 *
 * The goal of this abstraction is to avoid boilerplates in trivial stores,
 * used in a scale that does not care about fine-grained subscription or memoizing components.
 *
 */
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
