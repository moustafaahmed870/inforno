import { Order, OrderItem } from '../../../domain/entities/Order.js';
import { Address }          from '../../../domain/value-objects/Address.js';
import { Money }            from '../../../domain/value-objects/Money.js';

/**
 * @module PlaceOrderUseCase
 * Orchestrates: validate → build domain → persist → notify
 */
export class PlaceOrderUseCase {
  #orderRepo; #pizzaRepo; #notificationService;

  constructor({ orderRepo, pizzaRepo, notificationService }) {
    this.#orderRepo           = orderRepo;
    this.#pizzaRepo           = pizzaRepo;
    this.#notificationService = notificationService;
  }

  /**
   * @param {{
   *   cartItems: Array<{pizzaId: string, quantity: number}>,
   *   customerName: string,
   *   customerPhone: string,
   *   deliveryAddress?: {street: string, city: string, notes?: string},
   *   notes?: string,
   *   isDelivery?: boolean
   * }} params
   * @returns {Promise<Object>} OrderDTO
   */
  async execute({ cartItems, customerName, customerPhone, deliveryAddress, notes = '', isDelivery = true }) {
    // 1. Validate cart is not empty
    if (!cartItems?.length) throw new Error('السلة فارغة — أضف بيتزا أولاً');

    // 2. Fetch and validate all pizzas exist and are available
    const pizzas = await Promise.all(cartItems.map(({ pizzaId }) => this.#pizzaRepo.findById(pizzaId)));

    const missing     = pizzas.filter(p => !p);
    const unavailable = pizzas.filter(p => p && !p.isAvailable);
    if (missing.length)     throw new Error('بعض البيتزا غير موجودة في القائمة');
    if (unavailable.length) throw new Error(`غير متوفرة: ${unavailable.map(p => p.name).join(', ')}`);

    // 3. Build OrderItems
    const items = cartItems.map((cartItem, i) => new OrderItem({
      pizzaId:   pizzas[i].id,
      pizzaName: pizzas[i].name,
      unitPrice: pizzas[i].price,
      quantity:  cartItem.quantity,
    }));

    // 4. Build Order aggregate
    const address = isDelivery && deliveryAddress ? new Address(deliveryAddress) : null;
    const order   = new Order({
      id: this.#generateId(),
      items, customerName, customerPhone,
      deliveryAddress: address,
      notes, isDelivery,
    });

    // 5. Persist
    await this.#orderRepo.save(order);

    // 6. Notify
    this.#notificationService.notify('تم استلام طلبك بنجاح! 🍕', 'success');
    this.#notificationService.playSound('newOrder');

    return order.toDTO();
  }

  #generateId() {
    return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  }
}
