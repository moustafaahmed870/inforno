/**
 * @interface IContentRepository
 * Persists editable site content (e.g. homepage hero text & image)
 */
export class IContentRepository {
  /** @param {string} key e.g. 'home' @returns {Promise<Object|null>} */
  get(key) { return Promise.reject(new Error('Not implemented: get')); }

  /** @param {string} key @param {Object} data @returns {Promise<void>} */
  set(key, data) { return Promise.reject(new Error('Not implemented: set')); }
}
