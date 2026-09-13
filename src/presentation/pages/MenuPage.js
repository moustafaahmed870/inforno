import { PizzaCard3D } from '../components/3d/PizzaCard3D.js';

/**
 * @module MenuPage
 * Full menu with category filters and 3D flip cards
 */
export class MenuPage {
  #useCases; #notification; #router;
  #allPizzas = []; #activeCategory = 'all'; #topPizzaId = null;

  constructor({ useCases, notification, router }) {
    this.#useCases    = useCases;
    this.#notification = notification;
    this.#router      = router;
  }

  async render(outlet) {
    outlet.innerHTML = `
      <div class="page container">
        <header class="menu-header fade-up">
          <h1 class="section-title">القائمة</h1>
          <p class="section-sub">عجينة طازجة، مكونات إيطالية، حب حقيقي</p>
        </header>

        <div class="filter-pills" id="categoryFilters">
          <button class="filter-pill active" data-cat="all">🍕 الكل</button>
          <button class="filter-pill" data-cat="classic">كلاسيك</button>
          <button class="filter-pill" data-cat="special">⭐ سبيشال</button>
          <button class="filter-pill" data-cat="hot">🌶 حار</button>
          <button class="filter-pill" data-cat="veggie">🥦 نباتي</button>
        </div>

        <div class="grid-auto" id="pizzaGrid">
          ${Array(6).fill('<div class="pizza-card skeleton" style="height:320px"></div>').join('')}
        </div>
      </div>`;

    await this.#loadMenu(outlet);
    this.#attachFilters(outlet);
  }

  async #loadMenu(outlet) {
    try {
      // allSettled بدل all: قراءة "الأكثر مبيعاً" محتاجة صلاحية أدمن على orders
      // (حسب firestore.rules)، فلو فشلت لزائر عادي منمنعش المنيو نفسه من الظهور.
      const [pizzasResult, topSellersResult] = await Promise.allSettled([
        this.#useCases.getMenu.execute(),
        this.#useCases.getTopSelling.execute(1),
      ]);

      if (pizzasResult.status === 'rejected') throw pizzasResult.reason;

      if (topSellersResult.status === 'rejected') {
        console.warn('تعذّر تحميل "الأكثر مبيعاً" (صلاحيات orders):', topSellersResult.reason);
      }

      this.#allPizzas  = pizzasResult.value;
      this.#topPizzaId = topSellersResult.status === 'fulfilled'
        ? (topSellersResult.value[0]?.id ?? null)
        : null;
      this.#renderCards(outlet, this.#allPizzas);
    } catch (err) {
      outlet.querySelector('#pizzaGrid').innerHTML =
        `<div class="empty-state"><div class="empty-state__icon">⚠️</div>
         <p class="empty-state__title">تعذّر تحميل القائمة</p>
         <p>${err.message}</p></div>`;
    }
  }

  #renderCards(outlet, pizzas) {
    const grid = outlet.querySelector('#pizzaGrid');
    if (!grid) return;

    if (!pizzas.length) {
      grid.innerHTML = `<div class="empty-state col-span-full">
        <div class="empty-state__icon">🍕</div>
        <p class="empty-state__title">لا توجد بيتزا في هذا التصنيف</p></div>`;
      return;
    }

    grid.innerHTML = '';
    pizzas.forEach((pizza, i) => {
      const displayPizza = pizza.id === this.#topPizzaId
        ? { ...pizza, badge: '🔥 الأكثر طلباً' }
        : pizza;
      const card = new PizzaCard3D({
        pizza: displayPizza,
        onSelect: (id) => this.#router.navigate(`#/menu/${id}`),
        onAddToCart: async (id) => {
          await this.#useCases.addToCart.execute({ pizzaId: id, quantity: 1 });
          this.#notification.notify(`${pizza.name} أُضيف للسلة 🛒`, 'success');
          this.#notification.playSound('addToCart');
        },
      });
      card.element.style.animationDelay = `${i * 60}ms`;
      card.element.classList.add('fade-up');
      grid.appendChild(card.element);
    });
  }

  #attachFilters(outlet) {
    outlet.querySelector('#categoryFilters').addEventListener('click', e => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;

      outlet.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      this.#activeCategory = pill.dataset.cat;
      const filtered = this.#activeCategory === 'all'
        ? this.#allPizzas
        : this.#allPizzas.filter(p => p.category === this.#activeCategory);

      this.#renderCards(outlet, filtered);
    });
  }
}
