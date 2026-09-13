/**
 * @interface IAuthService
 * Port — infrastructure implements this (e.g. Firebase Auth)
 */
export class IAuthService {
  /** @param {string} email @param {string} password @returns {Promise<{uid:string,email:string}>} */
  login(email, password) { return Promise.reject(new Error('Not implemented: login')); }

  /** @returns {Promise<void>} */
  logout() { return Promise.reject(new Error('Not implemented: logout')); }

  /** @returns {Promise<{uid:string,email:string,isAdmin:boolean}|null>} resolves once auth state is known */
  getCurrentUser() { return Promise.reject(new Error('Not implemented: getCurrentUser')); }

  /** @param {(user:{uid:string,email:string,isAdmin:boolean}|null)=>void} callback @returns {Function} unsubscribe */
  onAuthChanged(callback) { throw new Error('Not implemented: onAuthChanged'); }
}
