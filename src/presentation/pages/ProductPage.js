/**
 * @module ProductPage
 * Full product detail page — image, description, ingredients, quantity + add to cart
 */
export class ProductPage {
  #useCases; #pizzaId; #pizza = null; #quantity = 1;

  constructor({ useCases, pizzaId }) {
    this.#useCases = useCases;
    this.#pizzaId  = pizzaId;
  }

  async render(outlet) {
    outlet.innerHTML = `<div class="page-loader"><div class="pizza-spin">🍕</div></div>`;

    this.#pizza = await this.#useCases.getPizzaById.execute(this.#pizzaId);

    if (!this.#pizza) {
      outlet.innerHTML = `
        <div class="page container empty-state">
          <div class="empty-state__icon">🍕</div>
          <p class="empty-state__title">الصنف ده مش موجود</p>
          <a href="#/menu" class="btn btn--primary">الرجوع للقائمة</a>
        </div>`;
      return;
    }

    const p = this.#pizza;

    outlet.innerHTML = `
      <div class="page container product-page fade-up">
        <a href="#/menu" class="product-page__back">→ الرجوع للقائمة</a>

        <div class="product-page__layout">
          <div class="product-page__media">
            <div class="product-page__photo-wrap">
              ${p.images?.length
                ? `<img src="${this.#esc(p.images[0])}" alt="${this.#esc(p.name)}" class="product-page__photo" id="mainProductPhoto">`
                : `<div class="product-page__emoji">${this.#emoji(p.category)}</div>`}
              ${p.badge ? `<span class="badge badge--red product-page__badge">${this.#esc(p.badge)}</span>` : ''}
            </div>
            ${p.images?.length > 1 ? `
              <div class="product-page__thumbs">
                ${p.images.map((img, i) => `
                  <button type="button" class="product-page__thumb ${i === 0 ? 'active' : ''}" data-src="${this.#esc(img)}">
                    <img src="${this.#esc(img)}" alt="">
                  </button>`).join('')}
              </div>` : ''}
          </div>

          <div class="product-page__info">
            <h1 class="product-page__name">${this.#esc(p.name)}</h1>

            <div class="pizza-card__meta" style="margin-block:var(--sp-3)">
              ${this.#heatDots(p.heatLevel)} ${this.#stars(p.rating)}
              <span class="text-muted" style="margin-inline-start:8px">(${p.reviewCount} تقييم)</span>
            </div>

            <p class="product-page__price">${p.price} <small>جنيه</small></p>

            <p class="product-page__desc">${this.#esc(p.description)}</p>

            <div class="product-page__ingredients">
              ${p.ingredients.map(i => `<span class="ingredient-tag">${this.#esc(i)}</span>`).join('')}
            </div>

            <div class="product-page__actions">
              <div class="qty-stepper" id="qtyStepper">
                <button type="button" class="qty-stepper__btn" data-action="dec">−</button>
                <span class="qty-stepper__value" id="qtyValue">1</span>
                <button type="button" class="qty-stepper__btn" data-action="inc">+</button>
              </div>
              <button class="btn btn--primary btn--lg" id="addToCartBtn">أضف للسلة 🛒</button>
            </div>
          </div>
        </div>
      </div>`;

    this.#attachEvents(outlet);
  }

  #attachEvents(outlet) {
    const mainPhoto = outlet.querySelector('#mainProductPhoto');
    outlet.querySelectorAll('.product-page__thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        if (mainPhoto) mainPhoto.src = thumb.dataset.src;
        outlet.querySelectorAll('.product-page__thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });

    const qtyValueEl = outlet.querySelector('#qtyValue');
    outlet.querySelector('#qtyStepper').addEventListener('click', e => {
      const action = e.target.dataset.action;
      if (!action) return;
      this.#quantity = action === 'inc' ? this.#quantity + 1 : Math.max(1, this.#quantity - 1);
      qtyValueEl.textContent = this.#quantity;
    });

    const addBtn = outlet.querySelector('#addToCartBtn');
    addBtn.addEventListener('click', async () => {
      addBtn.disabled = true;
      addBtn.textContent = '...';
      try {
        await this.#useCases.addToCart.execute({ pizzaId: this.#pizza.id, quantity: this.#quantity });
        addBtn.textContent = '✅ تمت الإضافة';
        setTimeout(() => { addBtn.disabled = false; addBtn.textContent = 'أضف للسلة 🛒'; }, 1500);
      } catch (err) {
        addBtn.textContent = 'خطأ ❌';
        addBtn.disabled = false;
      }
    });
  }

  #emoji(category) {
    const map = { classic: '🍕', special: '⭐', hot: '🌶', veggie: '🥦' };
    return map[category] ?? '🍕';
  }

  #heatDots(level) {
    const dots = Array.from({ length: 5 }, (_, i) => `<span class="heat__dot ${i < level ? 'active' : ''}"></span>`).join('');
    return `<div class="heat">${dots}</div>`;
  }

  #stars(rating) {
    const full = Math.round(rating);
    const stars = Array.from({ length: 5 }, (_, i) => `<span class="star ${i < full ? 'filled' : ''}">★</span>`).join('');
    return `<div class="stars" title="${rating}/5">${stars}</div>`;
  }

  #esc(str = '') {
    return String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
  }
}
