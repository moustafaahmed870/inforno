/**
 * @module Money
 * Value Object — immutable, self-validating
 */
export class Money {
  /** @type {number} */ #amount;
  /** @type {string} */ #currency;

  /**
   * @param {number} amount
   * @param {string} [currency='EGP']
   */
  constructor(amount, currency = 'EGP') {
    if (typeof amount !== 'number' || isNaN(amount)) throw new Error('المبلغ يجب أن يكون رقماً');
    if (amount < 0) throw new Error('السعر لا يمكن أن يكون سالباً');
    this.#amount   = Math.round(amount * 100) / 100;
    this.#currency = currency;
    Object.freeze(this);
  }

  get amount()   { return this.#amount; }
  get currency() { return this.#currency; }

  /** @param {Money} other @returns {Money} */
  add(other)  { this.#assertSameCurrency(other); return new Money(this.#amount + other.#amount, this.#currency); }

  /** @param {Money} other @returns {Money} */
  subtract(other) { this.#assertSameCurrency(other); return new Money(this.#amount - other.#amount, this.#currency); }

  /** @param {number} factor @returns {Money} */
  multiply(factor) { return new Money(this.#amount * factor, this.#currency); }

  /** @param {Money} other @returns {boolean} */
  equals(other) { return this.#amount === other.#amount && this.#currency === other.#currency; }

  /** @param {Money} other @returns {boolean} */
  isGreaterThan(other) { this.#assertSameCurrency(other); return this.#amount > other.#amount; }

  format() { return `${this.#amount.toFixed(2)} ${this.#currency}`; }

  #assertSameCurrency(other) {
    if (this.#currency !== other.#currency)
      throw new Error(`لا يمكن مقارنة ${this.#currency} بـ ${other.#currency}`);
  }

  static zero(currency = 'EGP') { return new Money(0, currency); }

  toJSON() { return { amount: this.#amount, currency: this.#currency }; }
  static fromJSON({ amount, currency }) { return new Money(amount, currency); }
}
