/**
 * @module GetOrdersUseCase
 * Returns orders, optionally filtered by status
 */
export class GetOrdersUseCase {
  #orderRepo;
  constructor({ orderRepo }) { this.#orderRepo = orderRepo; }

  /** @param {{ status?: string }} [params] @returns {Promise<Object[]>} */
  async execute({ status } = {}) {
    const orders = status
      ? await this.#orderRepo.findByStatus(status)
      : await this.#orderRepo.findAll();

    return orders
      .map(o => o.toDTO())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}
