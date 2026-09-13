/**
 * @module UpdateOrderStatusUseCase
 * Advances order to next status — used by kitchen dashboard
 */
export class UpdateOrderStatusUseCase {
  #orderRepo; #notificationService;

  constructor({ orderRepo, notificationService }) {
    this.#orderRepo           = orderRepo;
    this.#notificationService = notificationService;
  }

  /** @param {{ orderId: string }} params @returns {Promise<Object>} updated OrderDTO */
  async execute({ orderId }) {
    const order = await this.#orderRepo.findById(orderId);
    if (!order) throw new Error(`الطلب ${orderId} غير موجود`);

    const newStatus = order.advance();
    await this.#orderRepo.save(order);

    this.#notificationService.notify(`الطلب ${orderId} — ${newStatus.label} ${newStatus.icon}`, 'info');
    if (newStatus.value === 'ready') this.#notificationService.playSound('orderReady');

    return order.toDTO();
  }
}
