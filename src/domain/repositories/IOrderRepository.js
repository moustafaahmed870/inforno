/**
 * @interface IOrderRepository
 */
export class IOrderRepository {
  /** @param {Order} order @returns {Promise<void>} */
  save(order)              { return Promise.reject(new Error('Not implemented: save')); }

  /** @param {string} id @returns {Promise<Order|null>} */
  findById(id)             { return Promise.reject(new Error('Not implemented: findById')); }

  /** @returns {Promise<Order[]>} */
  findAll()                { return Promise.reject(new Error('Not implemented: findAll')); }

  /** @param {OrderStatus} status @returns {Promise<Order[]>} */
  findByStatus(status)     { return Promise.reject(new Error('Not implemented: findByStatus')); }

  /** @param {string} id @returns {Promise<void>} */
  delete(id)               { return Promise.reject(new Error('Not implemented: delete')); }
}
