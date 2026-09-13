/**
 * @module Navbar
 * Sticky navbar — updates cart count reactively via Store subscription.
 * Shows a different link set on staff pages (admin/kitchen) vs public pages.
 */
export class Navbar {
  #cartState; #router; #unsubscribe = null;

  static PUBLIC_LINKS = [
    { href: '#/',         label: 'الرئيسية' },
    { href: '#/menu',     label: 'القائمة' },
    { href: '#/tracking', label: 'تتبع طلبك' },
  ];

  static STAFF_LINKS = [
    { href: '#/admin',    label: 'لوحة التحكم' },
    { href: '#/kitchen',  label: 'المطبخ' },
    { href: '#/delivery', label: 'التسليم' },
    { href: '#/menu',     label: 'القائمة' },
  ];

  constructor({ cartState, router }) {
    this.#cartState = cartState;
    this.#router    = router;
  }

  mount() {
    const nav = this.#render();
    document.body.prepend(nav);
    this.#attachScrollBehavior(nav);
    this.#unsubscribe = this.#cartState.subscribe(cart => this.#updateBadge(cart));
  }

  unmount() { this.#unsubscribe?.(); }

  #render() {
    const nav = document.createElement('nav');
    nav.className = 'navbar';
    nav.innerHTML = `
      <a href="#/" class="navbar__logo">🍕 <span>Inferno</span></a>
      <div class="navbar__links" id="navbarLinks"></div>
      <button class="navbar__cart-btn" id="cartToggle" aria-label="السلة">
        🛒
        <span class="navbar__cart-badge" id="cartBadge" hidden>0</span>
      </button>`;
    this.#renderLinks(nav);
    this.#toggleCartButton(nav);
    window.addEventListener('hashchange', () => {
      this.#renderLinks(nav);
      this.#toggleCartButton(nav);
    });
    return nav;
  }

  #isStaffContext() {
    const hash = window.location.hash || '#/';
    return hash.startsWith('#/admin') || hash.startsWith('#/kitchen') || hash.startsWith('#/delivery');
  }

  #toggleCartButton(nav) {
    nav.querySelector('#cartToggle').style.display = this.#isStaffContext() ? 'none' : '';
  }

  #renderLinks(nav) {
    const links = this.#isStaffContext() ? Navbar.STAFF_LINKS : Navbar.PUBLIC_LINKS;
    const hash  = window.location.hash || '#/';
    nav.querySelector('#navbarLinks').innerHTML = links.map(({ href, label }) => `
      <a href="${href}" class="navbar__link ${href === hash ? 'active' : ''}">${label}</a>
    `).join('');
  }

  #attachScrollBehavior(nav) {
    const handler = () => nav.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
  }

  #updateBadge(cart) {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    const count = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
    badge.textContent = count;
    badge.hidden = count === 0;
    badge.classList.add('bump');
    badge.addEventListener('animationend', () => badge.classList.remove('bump'), { once: true });
  }
}
