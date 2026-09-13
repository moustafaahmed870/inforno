import { PricingService } from '../../domain/services/PricingService.js';

/**
 * @module CartState
 * Manages cart slice in the Store — coordinates with PricingService
 */
export class CartState {
  static SLICE = 'cart';
  #store; #pricing;

  constructor(store) {
    this.#store   = store;
    this.#pricing = new PricingService();
    store.initSlice(CartState.SLICE, {
      items: [], subtotal: 0, tax: 0, deliveryFee: 0, total: 0,
      isDelivery: true, freeDeliveryRemaining: PricingService.FREE_DELIVERY,
    });
    this.#restore();
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  addItem({ pizza, quantity }) {
    this.#store.setState(CartState.SLICE, prev => {
      const idx  = prev.items.findIndex(i => i.pizza.id === pizza.id);
      const items = idx >= 0
        ? prev.items.map((i, n) => n === idx ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev.items, { pizza, quantity }];
      return this.#recalc(items, prev.isDelivery);
    });
    this.#persist();
  }

  removeItem(pizzaId) {
    this.#store.setState(CartState.SLICE, prev => {
      const items = prev.items.filter(i => i.pizza.id !== pizzaId);
      return this.#recalc(items, prev.isDelivery);
    });
    this.#persist();
  }

  updateQuantity(pizzaId, quantity) {
    this.#store.setState(CartState.SLICE, prev => {
      const items = prev.items.map(i => i.pizza.id === pizzaId ? { ...i, quantity } : i);
      return this.#recalc(items, prev.isDelivery);
    });
    this.#persist();
  }

  setDeliveryMode(isDelivery) {
    this.#store.setState(CartState.SLICE, prev =>
      this.#recalc(prev.items, isDelivery)
    );
    this.#persist();
  }

  clear() {
    this.#store.setState(CartState.SLICE, prev =>
      this.#recalc([], prev.isDelivery)
    );
    localStorage.removeItem('pizza_cart');
  }

  // ── Accessors ─────────────────────────────────────────────────────────────
  get snapshot() { return this.#store.getState(CartState.SLICE); }
  get itemCount() { return this.snapshot.items.reduce((s, i) => s + i.quantity, 0); }

  subscribe(listener) { return this.#store.subscribe(CartState.SLICE, listener); }

  // ── Private ───────────────────────────────────────────────────────────────
  #recalc(items, isDelivery) {
    const priceItems = items.map(i => ({ price: i.pizza.price, quantity: i.quantity }));
    const totals     = this.#pricing.calculateOrderTotal(priceItems, isDelivery);
    const remaining  = this.#pricing.remainingForFreeDelivery(totals.subtotal);
    return {
      items, isDelivery,
      subtotal:               totals.subtotal.amount,
      tax:                    totals.tax.amount,
      deliveryFee:            totals.deliveryFee.amount,
      total:                  totals.total.amount,
      freeDeliveryRemaining:  remaining.amount,
    };
  }

  #persist() {
    const { items, isDelivery } = this.snapshot;
    localStorage.setItem('pizza_cart', JSON.stringify({ items, isDelivery }));
  }

  #restore() {
    try {
      const saved = JSON.parse(localStorage.getItem('pizza_cart') || 'null');
      if (saved?.items?.length) {
        this.#store.setState(CartState.SLICE, this.#recalc(saved.items, saved.isDelivery ?? true));
      }
    } catch { /* ignore corrupt data */ }
  }
}
