/**
 * @module OrderStatus
 * Value Object — finite state machine for order lifecycle
 */
export class OrderStatus {
  /** @type {string} */ #value;
  /** @type {string} */ #label;
  /** @type {string} */ #icon;

  constructor(value, label, icon) {
    this.#value = value;
    this.#label = label;
    this.#icon  = icon;
    Object.freeze(this);
  }

  // ── Static instances ──────────────────────────────────────────────────────
  static PENDING    = new OrderStatus('pending',    'في الانتظار', '⏳');
  static PREPARING  = new OrderStatus('preparing',  'يتحضر',       '👨‍🍳');
  static BAKING     = new OrderStatus('baking',     'في الفرن',    '🔥');
  static READY      = new OrderStatus('ready',      'جاهز',        '📦');
  static ON_THE_WAY = new OrderStatus('on_the_way', 'في الطريق',   '🛵');
  static DELIVERED  = new OrderStatus('delivered',  'تم التسليم',  '✅');
  static CANCELLED  = new OrderStatus('cancelled',  'ملغي',        '❌');

  // ── State transition map (used by the kitchen's single "advance" action) ───
  static #transitions = new Map([
    ['pending',    OrderStatus.PREPARING],
    ['preparing',  OrderStatus.BAKING],
    ['baking',     OrderStatus.READY],
    ['ready',      OrderStatus.ON_THE_WAY],
    ['on_the_way', OrderStatus.DELIVERED],
  ]);

  // States a delivery admin can still cancel from — anything not already final
  static #cancelable = new Set(['pending', 'preparing', 'baking', 'ready', 'on_the_way']);

  static #all = [
    OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.BAKING,
    OrderStatus.READY, OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED, OrderStatus.CANCELLED,
  ];

  // ── Accessors ─────────────────────────────────────────────────────────────
  get value() { return this.#value; }
  get label() { return this.#label; }
  get icon()  { return this.#icon; }

  // ── Behaviour ─────────────────────────────────────────────────────────────
  next() {
    const next = OrderStatus.#transitions.get(this.#value);
    if (!next) throw new Error(`لا يمكن تحديث الطلب بعد مرحلة "${this.#label}"`);
    return next;
  }

  canAdvance()   { return OrderStatus.#transitions.has(this.#value); }
  canCancel()    { return OrderStatus.#cancelable.has(this.#value); }
  isFinal()      { return this.#value === 'delivered' || this.#value === 'cancelled'; }
  equals(other)  { return this.#value === other?.value; }

  /** @param {string} value @returns {OrderStatus} */
  static fromValue(value) {
    const found = OrderStatus.#all.find(s => s.#value === value);
    if (!found) throw new Error(`حالة الطلب "${value}" غير معروفة`);
    return found;
  }

  /** Steps shown on the customer tracking timeline (excludes the cancelled dead-end) */
  static allSteps() { return OrderStatus.#all.filter(s => s.value !== 'cancelled'); }

  toJSON() { return this.#value; }
}
