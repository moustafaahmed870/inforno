import { uploadImage } from '../../infrastructure/services/ImageUploadClient.js';
import { SEED_PIZZAS } from '../../infrastructure/data/seedData.js';

/**
 * Lazily loads Chart.js from CDN only when the admin dashboard actually
 * needs to draw a chart, instead of shipping it on every page of the site.
 * Safe to call multiple times — the script is only injected once.
 */
let chartJsPromise = null;
function loadChartJs() {
  if (window.Chart) return Promise.resolve(window.Chart);
  if (chartJsPromise) return chartJsPromise;

  chartJsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.3/chart.umd.min.js';
    script.onload = () => resolve(window.Chart);
    script.onerror = () => reject(new Error('تعذّر تحميل مكتبة الرسم البياني'));
    document.head.appendChild(script);
  });
  return chartJsPromise;
}

/**
 * @module AdminPage
 * Management dashboard — overview, products (CRUD), homepage content editor
 */
export class AdminPage {
  #useCases; #router; #notification; #activeTab = 'overview';

  constructor({ useCases, router, notification }) {
    this.#useCases    = useCases;
    this.#router      = router;
    this.#notification = notification;
  }

  async render(outlet) {
    outlet.innerHTML = `
      <div class="page container admin-page">
        <div class="admin-header fade-up">
          <h1 class="section-title" style="margin:0">لوحة الإدارة 📊</h1>
          <button class="btn btn--outline btn--sm" id="logoutBtn">تسجيل الخروج</button>
        </div>

        <div class="admin-tabs fade-up" id="adminTabs">
          <button class="admin-tab active" data-tab="overview">نظرة عامة</button>
          <button class="admin-tab" data-tab="products">المنتجات</button>
          <button class="admin-tab" data-tab="content">محتوى الصفحة الرئيسية</button>
        </div>

        <div id="tabOverview" class="admin-tab-panel">
          <!-- Stat cards -->
          <div class="admin-stats-grid fade-up" id="statsGrid">
            ${[1,2,3,4].map(() => `<div class="stat-card skeleton" style="height:120px"></div>`).join('')}
          </div>

          <!-- Charts row -->
          <div class="admin-charts-row">
            <div class="card card--raised admin-chart-card fade-up">
              <h3 class="admin-section-title">مبيعات الأسبوع</h3>
              <canvas id="weeklyChart" height="200"></canvas>
            </div>
            <div class="card card--raised admin-chart-card fade-up">
              <h3 class="admin-section-title">أكثر البيتزا مبيعاً 🏆</h3>
              <div id="topPizzas"></div>
            </div>
          </div>

          <!-- Orders table -->
          <div class="card card--raised fade-up" style="margin-top:var(--sp-8)">
            <div class="admin-table-header">
              <h3 class="admin-section-title">جميع الطلبات</h3>
              <input class="form-input" id="orderSearch" placeholder="ابحث باسم العميل..." style="max-width:240px">
            </div>
            <div class="table-wrapper" id="ordersTable">
              <div class="pizza-spin" style="margin:auto;padding:40px;font-size:2rem">🍕</div>
            </div>
          </div>
        </div>

        <div id="tabProducts" class="admin-tab-panel" hidden></div>
        <div id="tabContent"  class="admin-tab-panel" hidden></div>
      </div>`;

    this.#attachTabs(outlet);
    this.#attachLogout(outlet);
    await this.#loadDashboard(outlet);
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────
  #attachTabs(outlet) {
    outlet.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', () => this.#switchTab(outlet, btn.dataset.tab));
    });
  }

  async #switchTab(outlet, tab) {
    this.#activeTab = tab;
    outlet.querySelectorAll('.admin-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    outlet.querySelector('#tabOverview').hidden = tab !== 'overview';
    outlet.querySelector('#tabProducts').hidden = tab !== 'products';
    outlet.querySelector('#tabContent').hidden  = tab !== 'content';

    if (tab === 'products' && !outlet.querySelector('#tabProducts').dataset.loaded) {
      outlet.querySelector('#tabProducts').dataset.loaded = '1';
      await this.#renderProductsTab(outlet);
    }
    if (tab === 'content' && !outlet.querySelector('#tabContent').dataset.loaded) {
      outlet.querySelector('#tabContent').dataset.loaded = '1';
      await this.#renderContentTab(outlet);
    }
  }

  #attachLogout(outlet) {
    outlet.querySelector('#logoutBtn').addEventListener('click', async () => {
      await this.#useCases.logout.execute();
      this.#router.navigate('#/login');
    });
  }

  // ── Overview (unchanged behaviour) ──────────────────────────────────────────
  async #loadDashboard(outlet) {
    try {
      const [stats, orders] = await Promise.all([
        this.#useCases.getDashboardStats.execute(),
        this.#useCases.getOrders.execute(),
      ]);

      this.#renderStats(outlet, stats);
      await this.#renderWeeklyChart(outlet, stats.weeklyRevenue);
      this.#renderTopPizzas(outlet, stats.topPizzas);
      this.#renderOrdersTable(outlet, orders);
      this.#attachSearch(outlet, orders);
    } catch (e) {
      console.error('Admin load error:', e);
      const grid = outlet.querySelector('#statsGrid');
      if (grid) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">⚠️</div>
        <p class="empty-state__title">تعذّر تحميل البيانات</p>
        <p class="text-muted">${e.message}</p>
      </div>`;
    }
  }

  #renderStats(outlet, stats) {
    const { today } = stats;
    outlet.querySelector('#statsGrid').innerHTML = `
      <div class="stat-card">
        <p class="stat-card__label">إيرادات اليوم</p>
        <p class="stat-card__value">${today.revenue.toFixed(0)} ج</p>
        <p class="stat-card__change">↑ مقارنة بالأمس</p>
      </div>
      <div class="stat-card">
        <p class="stat-card__label">طلبات اليوم</p>
        <p class="stat-card__value">${today.orders}</p>
      </div>
      <div class="stat-card">
        <p class="stat-card__label">بيتزا مُباعة</p>
        <p class="stat-card__value">${today.pizzaCount}</p>
      </div>
      <div class="stat-card">
        <p class="stat-card__label">متوسط الطلب</p>
        <p class="stat-card__value">${today.avgOrderValue} ج</p>
      </div>`;
  }

  async #renderWeeklyChart(outlet, weeklyRevenue) {
    const canvas = outlet.querySelector('#weeklyChart');
    if (!canvas) return;

    let Chart;
    try {
      Chart = await loadChartJs();
    } catch (e) {
      console.error(e);
      return;
    }

    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: weeklyRevenue.map(d => d.day),
        datasets: [{
          label: 'الإيرادات (ج)',
          data: weeklyRevenue.map(d => d.revenue),
          backgroundColor: 'rgba(232,35,10,.7)',
          borderColor: '#E8230A',
          borderWidth: 2,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#8A8480' } },
          y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#8A8480' } },
        },
      },
    });
  }

  #renderTopPizzas(outlet, topPizzas) {
    const max = topPizzas[0]?.count || 1;
    outlet.querySelector('#topPizzas').innerHTML = topPizzas.map((p, i) => `
      <div class="top-pizza-item">
        <span class="top-pizza-rank">${['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span>${p.name}</span><span>${p.count}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar__fill" style="width:${Math.round(p.count/max*100)}%"></div>
          </div>
        </div>
      </div>`).join('');
  }

  #renderOrdersTable(outlet, orders) {
    const tableEl = outlet.querySelector('#ordersTable');
    if (!orders.length) {
      tableEl.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📋</div><p>لا توجد طلبات</p></div>`;
      return;
    }
    tableEl.innerHTML = `
      <table class="orders-table">
        <thead>
          <tr>
            <th>رقم الطلب</th><th>العميل</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr>
              <td><code>${o.id.slice(-10)}</code></td>
              <td>${o.customerName}</td>
              <td>${o.total} ج</td>
              <td><span class="badge badge--${this.#statusColor(o.status)}">${o.status}</span></td>
              <td>${new Date(o.createdAt).toLocaleString('ar-EG')}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;
  }

  #attachSearch(outlet, orders) {
    outlet.querySelector('#orderSearch').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const filtered = orders.filter(o =>
        o.customerName.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
      );
      this.#renderOrdersTable(outlet, filtered);
    });
  }

  #statusColor(status) {
    const map = { pending:'muted', preparing:'gold', baking:'gold', ready:'gold', on_the_way:'green', delivered:'green', cancelled:'red' };
    return map[status] ?? 'muted';
  }

  // ── Products tab ─────────────────────────────────────────────────────────────
  async #renderProductsTab(outlet) {
    const panel = outlet.querySelector('#tabProducts');
    panel.innerHTML = `
      <div class="admin-table-header">
        <h3 class="admin-section-title">إدارة المنتجات</h3>
        <button class="btn btn--primary btn--sm" id="newPizzaBtn">+ إضافة صنف جديد</button>
      </div>
      <div id="pizzaFormWrap"></div>
      <div class="card card--raised" style="margin-top:var(--sp-6)">
        <div class="table-wrapper" id="productsTable">
          <div class="pizza-spin" style="margin:auto;padding:40px;font-size:2rem">🍕</div>
        </div>
      </div>`;

    panel.querySelector('#newPizzaBtn').addEventListener('click', () => this.#showPizzaForm(outlet, null));

    await this.#loadProducts(outlet);
  }

  async #loadProducts(outlet) {
    const pizzas = await this.#useCases.getAllPizzas.execute();
    const tableEl = outlet.querySelector('#productsTable');

    if (!pizzas.length) {
      tableEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🍕</div>
          <p>لا توجد أصناف بعد</p>
          <button class="btn btn--outline btn--sm" id="seedDemoBtn" style="margin-top:var(--sp-4)">
            استيراد ٨ أصناف تجريبية للبدء بسرعة
          </button>
        </div>`;
      tableEl.querySelector('#seedDemoBtn')?.addEventListener('click', async (e) => {
        e.target.disabled = true;
        e.target.textContent = '...جاري الاستيراد';
        await Promise.all(SEED_PIZZAS.map(data => this.#useCases.savePizza.execute(data)));
        this.#notification?.notify('تم استيراد البيانات التجريبية 🍕', 'success');
        await this.#loadProducts(outlet);
      });
      return;
    }

    tableEl.innerHTML = `
      <table class="orders-table">
        <thead>
          <tr><th>الصورة</th><th>الاسم</th><th>السعر</th><th>الفئة</th><th>الحالة</th><th></th></tr>
        </thead>
        <tbody>
          ${pizzas.map(p => `
            <tr data-id="${p.id}">
              <td>${p.image ? `<img src="${p.image}" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:8px">` : '🍕'}</td>
              <td>${p.name}</td>
              <td>${p.price} ج</td>
              <td>${p.category}</td>
              <td><span class="badge badge--${p.isAvailable ? 'green' : 'muted'}">${p.isAvailable ? 'متاح' : 'مخفي'}</span></td>
              <td style="display:flex;gap:8px">
                <button class="btn btn--ghost btn--sm" data-action="edit">تعديل</button>
                <button class="btn btn--ghost btn--sm" data-action="toggle">${p.isAvailable ? 'إخفاء' : 'إظهار'}</button>
                <button class="btn btn--ghost btn--sm" data-action="delete" style="color:var(--c-error)">حذف</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    tableEl.querySelectorAll('tr[data-id]').forEach(row => {
      const id = row.dataset.id;
      const pizza = pizzas.find(p => p.id === id);
      row.querySelector('[data-action="edit"]').addEventListener('click', () => this.#showPizzaForm(outlet, pizza));
      row.querySelector('[data-action="toggle"]').addEventListener('click', async () => {
        await this.#useCases.togglePizza.execute(id);
        this.#notification?.notify('تم تحديث حالة الصنف', 'success');
        await this.#loadProducts(outlet);
      });
      row.querySelector('[data-action="delete"]').addEventListener('click', async () => {
        if (!confirm(`متأكد إنك عايز تحذف "${pizza.name}"؟`)) return;
        await this.#useCases.deletePizza.execute(id);
        this.#notification?.notify('تم حذف الصنف', 'success');
        await this.#loadProducts(outlet);
      });
    });
  }

  #showPizzaForm(outlet, pizza) {
    const wrap = outlet.querySelector('#pizzaFormWrap');
    const dto = pizza ?? {};
    wrap.innerHTML = `
      <form class="card card--raised" id="pizzaForm" style="padding:var(--sp-6);display:flex;flex-direction:column;gap:var(--sp-4)">
        <h4 class="admin-section-title">${pizza ? 'تعديل صنف' : 'صنف جديد'}</h4>

        <div class="form-group">
          <label class="form-label">اسم الصنف</label>
          <input class="form-input" name="name" required value="${dto.name ?? ''}">
        </div>

        <div class="form-group">
          <label class="form-label">الوصف</label>
          <textarea class="form-input" name="description" rows="2">${dto.description ?? ''}</textarea>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
          <div class="form-group">
            <label class="form-label">السعر (ج)</label>
            <input class="form-input" name="price" type="number" min="1" step="1" required value="${dto.price ?? ''}">
          </div>
          <div class="form-group">
            <label class="form-label">الفئة</label>
            <select class="form-input" name="category">
              ${['classic','special','hot','veggie'].map(c => `<option value="${c}" ${dto.category===c?'selected':''}>${c}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">المكونات (افصل بفاصلة)</label>
          <input class="form-input" name="ingredients" value="${(dto.ingredients ?? []).join('، ')}">
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4)">
          <div class="form-group">
            <label class="form-label">مستوى الحرارة (0-5)</label>
            <input class="form-input" name="heatLevel" type="number" min="0" max="5" value="${dto.heatLevel ?? 0}">
          </div>
          <div class="form-group">
            <label class="form-label">شارة (اختياري)</label>
            <input class="form-input" name="badge" value="${dto.badge ?? ''}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">صور الصنف (حتى 3 صور)</label>
          <div class="pizza-images-manager" id="pizzaImagesManager"></div>
          <input type="file" accept="image/*" id="pizzaImageInput" style="margin-top:var(--sp-3)">
          <p class="text-muted" id="pizzaImagesHint" style="margin-top:4px"></p>
        </div>

        <p class="form-error" id="pizzaFormError" hidden></p>

        <div style="display:flex;gap:var(--sp-3)">
          <button type="submit" class="btn btn--primary">حفظ</button>
          <button type="button" class="btn btn--ghost" id="cancelPizzaForm">إلغاء</button>
        </div>
      </form>`;

    const form = wrap.querySelector('#pizzaForm');
    wrap.querySelector('#cancelPizzaForm').addEventListener('click', () => { wrap.innerHTML = ''; });

    // ── Multi-image manager (up to 3) ─────────────────────────────────────
    let currentImages = [...(dto.images ?? (dto.image ? [dto.image] : []))];
    const manager  = wrap.querySelector('#pizzaImagesManager');
    const fileInput = wrap.querySelector('#pizzaImageInput');
    const hint      = wrap.querySelector('#pizzaImagesHint');

    const renderThumbs = () => {
      manager.innerHTML = currentImages.map((url, i) => `
        <div class="pizza-image-thumb">
          <img src="${url}" alt="">
          <button type="button" class="pizza-image-thumb__remove" data-index="${i}" title="إزالة">×</button>
        </div>`).join('');
      manager.querySelectorAll('.pizza-image-thumb__remove').forEach(btn => {
        btn.addEventListener('click', () => {
          currentImages.splice(Number(btn.dataset.index), 1);
          renderThumbs();
        });
      });
      const full = currentImages.length >= 3;
      fileInput.disabled = full;
      hint.textContent = full ? 'وصلت للحد الأقصى (3 صور) — احذف صورة عشان تضيف بدلها' : `${currentImages.length}/3 صور`;
    };
    renderThumbs();

    fileInput.addEventListener('change', async e => {
      const file = e.target.files[0];
      e.target.value = ''; // allow re-selecting the same file later
      if (!file || currentImages.length >= 3) return;
      hint.textContent = '...جاري رفع الصورة';
      try {
        const url = await uploadImage(file);
        currentImages.push(url);
        renderThumbs();
        this.#notification?.notify('تم رفع الصورة', 'success');
      } catch (err) {
        this.#notification?.notify(err.message, 'error');
        renderThumbs();
      }
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const errEl = form.querySelector('#pizzaFormError');
      errEl.hidden = true;
      const fd = new FormData(form);
      try {
        await this.#useCases.savePizza.execute({
          id: dto.id ?? null,
          name: fd.get('name'),
          description: fd.get('description'),
          price: Number(fd.get('price')),
          category: fd.get('category'),
          ingredients: fd.get('ingredients').split('،').map(s => s.trim()).filter(Boolean),
          heatLevel: Number(fd.get('heatLevel')) || 0,
          badge: fd.get('badge') || null,
          images: currentImages,
          isAvailable: dto.isAvailable ?? true, // preserve hidden/visible state when editing
          rating: dto.rating ?? 0,              // preserve accumulated customer rating
          reviewCount: dto.reviewCount ?? 0,    // preserve accumulated review count
        });
        this.#notification?.notify('تم حفظ الصنف بنجاح', 'success');
        wrap.innerHTML = '';
        await this.#loadProducts(outlet);
      } catch (err) {
        errEl.textContent = err.message;
        errEl.hidden = false;
      }
    });
  }

  // ── Homepage content tab ─────────────────────────────────────────────────────
  async #renderContentTab(outlet) {
    const panel = outlet.querySelector('#tabContent');
    const content = await this.#useCases.getHomeContent.execute();

    panel.innerHTML = `
      <form class="card card--raised" id="contentForm" style="padding:var(--sp-6);display:flex;flex-direction:column;gap:var(--sp-4);max-width:640px">
        <h3 class="admin-section-title">تعديل محتوى الصفحة الرئيسية</h3>

        <div class="form-group">
          <label class="form-label">السطر العلوي الصغير (Eyebrow)</label>
          <input class="form-input" name="heroEyebrow" value="${content.heroEyebrow}">
        </div>

        <div class="form-group">
          <label class="form-label">العنوان — السطر الأول</label>
          <input class="form-input" name="heroTitleLine1" value="${content.heroTitleLine1}">
        </div>

        <div class="form-group">
          <label class="form-label">العنوان — السطر الثاني (باللون الأحمر)</label>
          <input class="form-input" name="heroTitleLine2" value="${content.heroTitleLine2}">
        </div>

        <div class="form-group">
          <label class="form-label">الوصف</label>
          <textarea class="form-input" name="heroDescription" rows="3">${content.heroDescription}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label">صورة الخلفية</label>
          <input type="file" accept="image/*" id="heroImageInput">
          <img id="heroImagePreview" src="${content.heroImage ?? ''}" alt=""
               style="${content.heroImage ? '' : 'display:none;'}width:100%;max-width:320px;border-radius:12px;margin-top:8px">
          <input type="hidden" name="heroImage" value="${content.heroImage ?? ''}">
        </div>

        <p class="form-error" id="contentFormError" hidden></p>
        <button type="submit" class="btn btn--primary" style="align-self:flex-start">حفظ التغييرات</button>
      </form>`;

    const form = panel.querySelector('#contentForm');

    panel.querySelector('#heroImageInput').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      const preview = form.querySelector('#heroImagePreview');
      const hiddenInput = form.querySelector('[name="heroImage"]');
      try {
        preview.style.display = '';
        preview.src = URL.createObjectURL(file);
        const url = await uploadImage(file);
        hiddenInput.value = url;
        preview.src = url;
        this.#notification?.notify('تم رفع الصورة', 'success');
      } catch (err) {
        this.#notification?.notify(err.message, 'error');
      }
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const errEl = form.querySelector('#contentFormError');
      errEl.hidden = true;
      const fd = new FormData(form);
      try {
        await this.#useCases.updateHomeContent.execute({
          heroEyebrow:     fd.get('heroEyebrow'),
          heroTitleLine1:  fd.get('heroTitleLine1'),
          heroTitleLine2:  fd.get('heroTitleLine2'),
          heroDescription: fd.get('heroDescription'),
          heroImage:       fd.get('heroImage') || null,
        });
        this.#notification?.notify('تم حفظ محتوى الصفحة الرئيسية 🎉', 'success');
      } catch (err) {
        errEl.textContent = err.message;
        errEl.hidden = false;
      }
    });
  }
}
