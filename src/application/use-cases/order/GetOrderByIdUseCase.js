/**
 * @module GetOrderByIdUseCase
 * Fetches a single order directly by id — used by the customer tracking page.
 * This reads exactly one document (a Firestore "get"), which is what allows
 * a non-admin customer to read their own order under the security rules,
 * unlike listing the whole orders collection which is admin-only.
 */
export class GetOrderByIdUseCase {
  #orderRepo;
  constructor({ orderRepo }) { this.#orderRepo = orderRepo; }

  /** @param {string} id @returns {Promise<Object|null>} OrderDTO or null if not found */
  async execute(id) {
    const order = await this.#orderRepo.findById(id);
    return order ? order.toDTO() : null;
  }
}
