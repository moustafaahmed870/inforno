/**
 * @interface IPizzaRepository
 * All methods return Promises — implementations may be sync or async
 */
export class IPizzaRepository {
  /** @param {Pizza} pizza @returns {Promise<void>} */
  save(pizza)                { return Promise.reject(new Error('Not implemented: save')); }

  /** @param {string} id @returns {Promise<Pizza|null>} */
  findById(id)               { return Promise.reject(new Error('Not implemented: findById')); }

  /** @returns {Promise<Pizza[]>} */
  findAll()                  { return Promise.reject(new Error('Not implemented: findAll')); }

  /** @param {string} category @returns {Promise<Pizza[]>} */
  findByCategory(category)   { return Promise.reject(new Error('Not implemented: findByCategory')); }

  /** @param {string} id @returns {Promise<void>} */
  delete(id)                 { return Promise.reject(new Error('Not implemented: delete')); }
}
