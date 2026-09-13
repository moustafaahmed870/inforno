/**
 * @module PizzaCard3D
 * Self-contained 3D flip card — receives pizza DTO, emits events upward
 */
export class PizzaCard3D {
  #pizza; #onAddToCart; #onSelect; #element = null;

  static CATEGORY_EMOJI = {
    classic: '🍕', special: '⭐', hot: '🌶', veggie: '🥦',
  };

  /** @param {{ pizza: Object, onAddToCart: Function, onSelect?: Function }} opts */
  constructor({ pizza, onAddToCart, onSelect }) {
    this.#pizza       = pizza;
    this.#onAddToCart = onAddToCart;
    this.#onSelect    = onSelect;
  }

  get element() {
    this.#element ??= this.#build();
    return this.#element;
  }

  // ── Build ─────────────────────────────────────────────────────────────────
  #build() {
    const p   = this.#pizza;
    const el  = document.createElement('div');
    el.className  = 'card-3d pizza-card';
    el.dataset.id = p.id;

    el.innerHTML = `
      <div class="card-3d__inner">
        <!-- Front -->
        <div class="card-3d__front pizza-card__front">
          ${p.badge ? `<span class="badge badge--red pizza-card__badge">${p.badge}</span>` : ''}
          ${p.image
            ? `<div class="pizza-card__photo"><img src="${p.image}" alt="${p.name}" loading="lazy"></div>`
            : `<div class="pizza-card__emoji">${this.#emoji()}</div>`}
          <div class="pizza-card__info">
            <h3 class="pizza-card__name">${p.name}</h3>
            <div class="pizza-card__meta">
              ${this.#heatDots()} ${this.#stars()}
            </div>
            <p class="pizza-card__price">${p.price} <small>جنيه</small></p>
          </div>
          <div class="pizza-card__hint">اضغط للتفاصيل ↩</div>
        </div>

        <!-- Back -->
        <div class="card-3d__back pizza-card__back">
          <h3 class="pizza-card__name">${p.name}</h3>
          <p class="pizza-card__desc">${p.description}</p>
          <div class="pizza-card__ingredients">
            ${p.ingredients.map(i => `<span class="ingredient-tag">${i}</span>`).join('')}
          </div>
          <div class="pizza-card__back-footer">
            <span class="pizza-card__price">${p.price} جنيه</span>
            <button class="btn btn--primary btn--sm add-to-cart-btn" data-id="${p.id}">
              أضف للسلة 🛒
            </button>
          </div>
        </div>
      </div>`;

    this.#attachEvents(el);
    return el;
  }

  #attachEvents(el) {
    // Open the full product page — ignored if the click came from the add-to-cart button
    if (this.#onSelect) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => this.#onSelect(this.#pizza.id));
    }

    // Add to cart — stop propagation so it doesn't also open the product page
    el.querySelector('.add-to-cart-btn').addEventListener('click', async e => {
      e.stopPropagation();
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = '...';
      try {
        await this.#onAddToCart(this.#pizza.id);
        btn.textContent = '✅ تمت الإضافة';
        setTimeout(() => { btn.disabled = false; btn.textContent = 'أضف للسلة 🛒'; }, 1500);
      } catch (err) {
        btn.textContent = 'خطأ ❌';
        btn.disabled = false;
      }
    });
  }

  #emoji() {
    return `<span class="pizza-card__emoji-inner">${PizzaCard3D.CATEGORY_EMOJI[this.#pizza.category] ?? '🍕'}</span>`;
  }

  #heatDots() {
    const dots = Array.from({ length: 5 }, (_, i) =>
      `<span class="heat__dot ${i < this.#pizza.heatLevel ? 'active' : ''}"></span>`
    ).join('');
    return `<div class="heat">${dots}</div>`;
  }

  #stars() {
    const full  = Math.round(this.#pizza.rating);
    const stars = Array.from({ length: 5 }, (_, i) =>
      `<span class="star ${i < full ? 'filled' : ''}">★</span>`
    ).join('');
    return `<div class="stars" title="${this.#pizza.rating}/5">${stars}</div>`;
  }
}
