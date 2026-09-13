/**
 * @module CancelOrderUseCase
 * Cancels an order — used by the admin delivery tab
 */
export class CancelOrderUseCase {
  #orderRepo; #notificationService;

  constructor({ orderRepo, notificationService }) {
    this.#orderRepo           = orderRepo;
    this.#notificationService = notificationService;
  }

  /** @param {{ orderId: string }} params @returns {Promise<Object>} updated OrderDTO */
  async execute({ orderId }) {
    const order = await this.#orderRepo.findById(orderId);
    if (!order) throw new Error(`الطلب ${orderId} غير موجود`);

    order.cancel();
    await this.#orderRepo.save(order);

    this.#notificationService.notify(`تم إلغاء الطلب ${orderId} ❌`, 'warning');
    return order.toDTO();
  }
}
