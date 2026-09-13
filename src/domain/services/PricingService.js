import { Money } from '../value-objects/Money.js';

/**
 * @module PricingService
 * Domain Service — pure pricing logic, no side effects
 */
export class PricingService {
  static TAX_RATE        = 0.14;   // 14% VAT
  static FREE_DELIVERY   = 200;    // EGP threshold for free delivery
  static DELIVERY_FEE    = 25;     // EGP flat delivery fee

  /**
   * @param {Array<{price: number, quantity: number}>} items
   * @returns {{ subtotal: Money, tax: Money, deliveryFee: Money, total: Money }}
   */
  calculateOrderTotal(items, isDelivery = true) {
    const subtotal    = items.reduce((acc, { price, quantity }) =>
      acc.add(new Money(price).multiply(quantity)), Money.zero());

    const tax         = subtotal.multiply(PricingService.TAX_RATE);
    const deliveryFee = this.#calcDelivery(subtotal, isDelivery);
    const total       = subtotal.add(tax).add(deliveryFee);

    return { subtotal, tax, deliveryFee, total };
  }

  /** @param {Money} subtotal @param {boolean} isDelivery @returns {Money} */
  #calcDelivery(subtotal, isDelivery) {
    if (!isDelivery) return Money.zero();
    return subtotal.amount >= PricingService.FREE_DELIVERY
      ? Money.zero()
      : new Money(PricingService.DELIVERY_FEE);
  }

  /**
   * How much more until free delivery
   * @param {Money} subtotal @returns {Money}
   */
  remainingForFreeDelivery(subtotal) {
    const threshold = new Money(PricingService.FREE_DELIVERY);
    return subtotal.isGreaterThan(threshold) ? Money.zero() : threshold.subtract(subtotal);
  }
}
