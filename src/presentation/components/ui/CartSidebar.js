/**
 * @module CartSidebar
 * Sliding cart panel — subscribes to CartState, renders reactively
 */
export class CartSidebar {
  #cartState; #useCases; #router;
  #element = null; #unsubscribe = null; #isOpen = false;

  constructor({ cartState, useCases, router }) {
    this.#cartState = cartState;
    this.#useCases  = useCases;
    this.#router    = router;
  }

  mount() {
    this.#element = this.#build();
    document.body.appendChild(this.#element);

    // Render items reactively — but NEVER auto-open the sidebar
    this.#unsubscribe = this.#cartState.subscribe(cart => this.#renderItems(cart));

    // Open ONLY when the cart button is explicitly clicked
    document.addEventListener('click', e => {
      if (e.target.closest('#cartToggle')) {
        e.stopPropagation();
        this.toggle();
      }
    });
  }

  open() {
    this.#isOpen = true;
    this.#element.classList.add('cart-sidebar--open');
  }

  close() {
    this.#isOpen = false;
    this.#element.classList.remove('cart-sidebar--open');
  }

  toggle() { this.#isOpen ? this.close() : this.open(); }

  unmount() { this.#unsubscribe?.(); this.#element?.remove(); }

  // ── Build skeleton ────────────────────────────────────────────────────────
  #build() {
    const el = document.createElement('div');
    // Explicitly start closed — never inherit any open state
    el.className = 'cart-sidebar';
    el.removeAttribute('open');
    el.innerHTML = `
      <div class="cart-sidebar__backdrop"></div>
      <aside class="cart-sidebar__panel">
        <header class="cart-sidebar__header">
          <h2>سلة الطلبات 🛒</h2>
          <button class="btn btn--ghost btn--icon cart-sidebar__close">✕</button>
        </header>
        <div class="cart-sidebar__items" id="cartItems"></div>
        <footer class="cart-sidebar__footer" id="cartFooter"></footer>
      </aside>`;

    el.querySelector('.cart-sidebar__backdrop').addEventListener('click', () => this.close());
    el.querySelector('.cart-sidebar__close').addEventListener('click', () => this.close());
    return el;
  }

  // ── Reactive render ───────────────────────────────────────────────────────
  #renderItems(cart) {
    const itemsEl  = this.#element.querySelector('#cartItems');
    const footerEl = this.#element.querySelector('#cartFooter');

    if (!cart?.items?.length) {
      itemsEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🍕</div>
          <p class="empty-state__title">السلة فارغة</p>
          <p>أضف بيتزا من القائمة</p>
        </div>`;
      footerEl.innerHTML = '';
      return;
    }

    itemsEl.innerHTML = cart.items.map(item => `
      <div class="cart-item" data-id="${item.pizza.id}">
        <div class="cart-item__emoji">${item.pizza.category === 'hot' ? '🌶' : '🍕'}</div>
        <div class="cart-item__info">
          <p class="cart-item__name">${item.pizza.name}</p>
          <p class="cart-item__unit">${item.pizza.price} جنيه / قطعة</p>
        </div>
        <div class="qty-ctrl">
          <button class="qty-ctrl__btn" data-action="dec" data-id="${item.pizza.id}">−</button>
          <span class="qty-ctrl__num">${item.quantity}</span>
          <button class="qty-ctrl__btn" data-action="inc" data-id="${item.pizza.id}">+</button>
        </div>
        <p class="cart-item__subtotal">${(item.pizza.price * item.quantity).toFixed(0)} ج</p>
        <button class="cart-item__remove" data-id="${item.pizza.id}" aria-label="إزالة">✕</button>
      </div>`).join('');

    // Free delivery progress
    const pct = cart.freeDeliveryRemaining > 0
      ? Math.round((1 - cart.freeDeliveryRemaining / 200) * 100)
      : 100;

    footerEl.innerHTML = `
      ${cart.freeDeliveryRemaining > 0 ? `
        <div class="cart-delivery-hint">
          <p>أضف <strong>${cart.freeDeliveryRemaining.toFixed(0)} ج</strong> للتوصيل المجاني 🎁</p>
          <div class="progress-bar"><div class="progress-bar__fill" style="width:${pct}%"></div></div>
        </div>` : `<p class="cart-free-delivery">🎉 توصيل مجاني!</p>`}
      <div class="cart-totals">
        <div class="cart-totals__row"><span>المجموع</span><span>${cart.subtotal.toFixed(2)} ج</span></div>
        <div class="cart-totals__row"><span>ضريبة (14%)</span><span>${cart.tax.toFixed(2)} ج</span></div>
        <div class="cart-totals__row"><span>التوصيل</span><span>${cart.deliveryFee > 0 ? cart.deliveryFee + ' ج' : 'مجاني'}</span></div>
        <hr class="divider">
        <div class="cart-totals__row cart-totals__row--total">
          <span>الإجمالي</span><span>${cart.total.toFixed(2)} ج</span>
        </div>
      </div>
      <button class="btn btn--primary btn--full btn--lg glow-pulse" id="checkoutBtn">
        إتمام الطلب ←
      </button>`;

    this.#attachItemEvents(itemsEl, footerEl);
  }

  #attachItemEvents(itemsEl, footerEl) {
    itemsEl.querySelectorAll('.qty-ctrl__btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id   = btn.dataset.id;
        const curr = this.#cartState.snapshot.items.find(i => i.pizza.id === id)?.quantity ?? 1;
        if (btn.dataset.action === 'inc') {
          await this.#useCases.updateCartQuantity.execute({ pizzaId: id, quantity: curr + 1 });
        } else if (curr <= 1) {
          await this.#useCases.removeFromCart.execute({ pizzaId: id });
        } else {
          await this.#useCases.updateCartQuantity.execute({ pizzaId: id, quantity: curr - 1 });
        }
      });
    });

    itemsEl.querySelectorAll('.cart-item__remove').forEach(btn => {
      btn.addEventListener('click', () =>
        this.#useCases.removeFromCart.execute({ pizzaId: btn.dataset.id })
      );
    });

    footerEl.querySelector('#checkoutBtn')?.addEventListener('click', () => {
      this.close();
      this.#router.navigate('#/checkout');
    });
  }
}
