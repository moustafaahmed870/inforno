/**
 * @module Router
 * Hash-based SPA router — no external dependencies
 * Supports simple dynamic segments, e.g. '#/menu/:id'
 */
export class Router {
  /** @type {{ pattern:string, regex:RegExp, keys:string[], factory:Function }[]} */
  #routes   = [];
  /** @type {Function|null} */ #notFound = null;
  /** @type {HTMLElement} */   #outlet;

  /** @param {HTMLElement} outlet - container where pages are rendered */
  constructor(outlet) {
    this.#outlet = outlet;
    window.addEventListener('hashchange', () => this.#dispatch());
  }

  /**
   * @param {string} pattern e.g. '#/menu' or '#/menu/:id'
   * @param {Function} factory async (params) => { render(outlet) }
   */
  on(pattern, factory) {
    const keys = [];
    const regexStr = pattern
      .split('/')
      .map(segment => {
        if (segment.startsWith(':')) {
          keys.push(segment.slice(1));
          return '([^/]+)';
        }
        return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');
    this.#routes.push({ pattern, regex: new RegExp(`^${regexStr}$`), keys, factory });
    return this;
  }

  notFound(factory) {
    this.#notFound = factory;
    return this;
  }

  start() { this.#dispatch(); }

  navigate(path) { window.location.hash = path; }

  async #dispatch() {
    const hash = window.location.hash || '#/';

    let matched = null;
    let params  = {};
    for (const route of this.#routes) {
      const m = hash.match(route.regex);
      if (m) {
        matched = route.factory;
        route.keys.forEach((key, i) => { params[key] = decodeURIComponent(m[i + 1]); });
        break;
      }
    }
    const factory = matched ?? this.#notFound;
    if (!factory) return;

    this.#outlet.innerHTML = '<div class="page-loader"><div class="pizza-spin">🍕</div></div>';
    try {
      const page = await factory(params);
      this.#outlet.innerHTML = '';
      await page.render(this.#outlet);
    } catch (err) {
      console.error('Router error:', err);
      this.#outlet.innerHTML = `<div class="error-page"><h2>حدث خطأ</h2><p>${err.message}</p></div>`;
    }
  }
}
