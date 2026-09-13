/**
 * @module Store
 * Minimal observable state container — no external dependencies
 * Follows Observer pattern with slice-based subscriptions
 */
export class Store {
  /** @type {Object<string, any>} */        #state     = {};
  /** @type {Map<string, Set<Function>>} */ #listeners = new Map();

  /**
   * @template T
   * @param {string} slice
   * @param {T} initialState
   */
  initSlice(slice, initialState) {
    this.#state[slice] = structuredClone(initialState);
  }

  /**
   * @param {string} slice
   * @returns {any} deep-cloned snapshot (no mutation leaks)
   */
  getState(slice) {
    return structuredClone(this.#state[slice]);
  }

  /**
   * @param {string} slice
   * @param {any | ((prev: any) => any)} updater
   */
  setState(slice, updater) {
    const prev = this.#state[slice];
    this.#state[slice] = typeof updater === 'function'
      ? updater(structuredClone(prev))
      : updater;
    this.#notify(slice, this.#state[slice]);
  }

  /**
   * Subscribe to state changes
   * @param {string} slice
   * @param {Function} listener
   * @returns {Function} unsubscribe function
   */
  /**
   * Subscribe to state changes.
   * The initial call is deferred via queueMicrotask so the caller's
   * constructor / mount() finishes BEFORE the first render fires.
   * @param {string} slice
   * @param {Function} listener
   * @returns {Function} unsubscribe function
   */
  subscribe(slice, listener) {
    if (!this.#listeners.has(slice)) this.#listeners.set(slice, new Set());
    this.#listeners.get(slice).add(listener);
    // Defer initial emission — ensures DOM element exists before first paint
    queueMicrotask(() => listener(this.getState(slice)));
    return () => this.#listeners.get(slice)?.delete(listener);
  }

  #notify(slice, state) {
    this.#listeners.get(slice)?.forEach(fn => fn(structuredClone(state)));
  }
}

export const store = new Store();
