import { DEFAULT_HOME_CONTENT } from '../../application/use-cases/content/ContentUseCases.js';

/**
 * @module HomePage
 * Hero landing — animated 3D pizza, CTA, quick stats
 */
export class HomePage {
  #useCases; #router;
  constructor({ useCases, router }) { this.#useCases = useCases; this.#router = router; }

  async render(outlet) {
    let content;
    try {
      content = await this.#useCases.getHomeContent.execute();
    } catch (err) {
      console.error('Could not load home content, using defaults:', err);
      content = DEFAULT_HOME_CONTENT; // keep the homepage usable even if Firestore is unreachable
    }
    const bgStyle = content.heroImage
      ? ` style="background-image:
          radial-gradient(ellipse 80% 60% at 60% 50%, rgba(232,35,10,.12) 0%, transparent 70%),
          radial-gradient(ellipse 50% 80% at 10% 80%,  rgba(212,160,23,.06) 0%, transparent 60%),
          linear-gradient(270deg, rgba(10,8,6,.92) 0%, rgba(10,8,6,.72) 32%, rgba(10,8,6,.35) 55%, rgba(10,8,6,.15) 75%),
          url('${this.#esc(content.heroImage)}');"`
      : '';

    outlet.innerHTML = `
      <main class="home-page">

        <!-- Hero -->
        <section class="hero">
          <div class="hero__bg"${bgStyle}></div>
          <div class="hero__content">
            <div class="hero__text fade-up">
              <p class="hero__eyebrow">${this.#esc(content.heroEyebrow)}</p>
              <h1 class="hero__title">
                ${this.#esc(content.heroTitleLine1)}<br>
                <em>${this.#esc(content.heroTitleLine2)}</em>
              </h1>
              <p class="hero__desc">
                ${this.#esc(content.heroDescription)}
              </p>
              <div class="hero__actions">
                <a href="#/menu" class="btn btn--primary btn--lg glow-pulse">اطلب الآن</a>
                <a href="#/tracking" class="btn btn--outline btn--lg">تتبع طلبك</a>
              </div>
            </div>

          </div>

          <!-- Scroll hint -->
          <div class="hero__scroll">
            <span>اكتشف القائمة</span>
            <div class="scroll-arrow">↓</div>
          </div>
        </section>

        <!-- Menu section -->
        <section class="featured-section">
          <div class="container">
            <div class="section-header">
              <h2 class="section-title">قائمتنا</h2>
              <a href="#/menu" class="btn btn--ghost">عرض الكل ←</a>
            </div>
            <div class="grid-auto" id="menuGrid">
              ${[1,2,3,4].map(() => `<div class="pizza-card skeleton"></div>`).join('')}
            </div>
          </div>
        </section>

        <!-- How it works -->
        <section class="how-it-works">
          <div class="container">
            <h2 class="section-title" style="text-align:center">كيف يعمل السيستم؟</h2>
            <div class="steps-grid">
              <div class="step-card">
                <div class="step-card__icon">📋</div>
                <h3>اختر من القائمة</h3>
                <p>تصفّح 8 أنواع بيتزا وأضف ما تريد للسلة بضغطة واحدة</p>
              </div>
              <div class="step-card">
                <div class="step-card__icon">👨‍🍳</div>
                <h3>المطبخ يستلم</h3>
                <p>طلبك يظهر فوراً على شاشة المطبخ ويبدأ الطباخ في التحضير</p>
              </div>
              <div class="step-card">
                <div class="step-card__icon">🛵</div>
                <h3>تتبّع لحظة بلحظة</h3>
                <p>تابع رحلة بيتزاك من الفرن لحد بيتك في الوقت الحقيقي</p>
              </div>
            </div>
          </div>
        </section>

      </main>`;

    await this.#loadMenuGrid(outlet);
  }

  async #loadMenuGrid(outlet) {
    try {
      // allSettled بدل all: قراءة "الأكثر مبيعاً" محتاجة صلاحية أدمن على orders
      // (حسب firestore.rules)، فلو فشلت لزائر عادي منمنعش المنيو نفسه من الظهور.
      const [pizzasResult, topSellersResult] = await Promise.allSettled([
        this.#useCases.getMenu.execute(),
        this.#useCases.getTopSelling.execute(1),
      ]);

      if (pizzasResult.status === 'rejected') throw pizzasResult.reason;
      const pizzas = pizzasResult.value;

      if (topSellersResult.status === 'rejected') {
        console.warn('تعذّر تحميل "الأكثر مبيعاً" (صلاحيات orders):', topSellersResult.reason);
      }
      const topSellers = topSellersResult.status === 'fulfilled' ? topSellersResult.value : [];
      const topId = topSellers[0]?.id ?? null;

      const grid = outlet.querySelector('#menuGrid');
      if (!grid) return;

      if (!pizzas.length) {
        grid.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🍕</div><p>القائمة هتتحدث قريباً</p></div>`;
        return;
      }

      const { PizzaCard3D } = await import('../components/3d/PizzaCard3D.js');

      grid.innerHTML = '';
      pizzas.forEach(pizza => {
        const displayPizza = pizza.id === topId ? { ...pizza, badge: '🔥 الأكثر طلباً' } : pizza;
        const card = new PizzaCard3D({
          pizza: displayPizza,
          onSelect: id => this.#router.navigate(`#/menu/${id}`),
          onAddToCart: id => this.#useCases.addToCart.execute({ pizzaId: id, quantity: 1 }),
        });
        grid.appendChild(card.element);
      });
    } catch (e) {
      console.error('Menu grid load failed:', e);
    }
  }

  #esc(str = '') {
    return String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[m]));
  }
}
