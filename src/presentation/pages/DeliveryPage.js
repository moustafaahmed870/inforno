/**
 * @module DeliveryPage
 * Standalone staff page for managing out-for-delivery orders —
 * mark "في الطريق", "تم التسليم", or "ملغي"
 */
export class DeliveryPage {
  #useCases; #notification;

  constructor({ useCases, notification }) {
    this.#useCases     = useCases;
    this.#notification = notification;
  }

  async render(outlet) {
    outlet.innerHTML = `
      <div class="page container">
        <div class="admin-header fade-up">
          <h1 class="section-title" style="margin:0">التسليم 🛵</h1>
        </div>
        <div class="card card--raised fade-up">
          <div class="admin-table-header">
            <h3 class="admin-section-title">طلبات جاهزة للتسليم</h3>
          </div>
          <div class="table-wrapper" id="deliveryTable">
            <div class="pizza-spin" style="margin:auto;padding:40px;font-size:2rem">🍕</div>
          </div>
        </div>
      </div>`;

    await this.#loadOrders(outlet);
  }

  async #loadOrders(outlet) {
    const allOrders = await this.#useCases.getOrders.execute();
    // Only orders past the kitchen stage need a delivery decision
    const orders = allOrders.filter(o => ['ready', 'on_the_way'].includes(o.status));
    const tableEl = outlet.querySelector('#deliveryTable');

    if (!orders.length) {
      tableEl.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🛵</div><p>مفيش طلبات محتاجة تسليم دلوقتي</p></div>`;
      return;
    }

    tableEl.innerHTML = `
      <table class="orders-table">
        <thead>
          <tr><th>رقم الطلب</th><th>العميل</th><th>الهاتف</th><th>الحالة</th><th></th></tr>
        </thead>
        <tbody>
          ${orders.map(o => `
            <tr data-id="${o.id}">
              <td><code>${o.id.slice(-10)}</code></td>
              <td>${o.customerName}</td>
              <td>${o.customerPhone}</td>
              <td><span class="badge badge--${o.status === 'ready' ? 'gold' : 'green'}">${o.status === 'ready' ? 'جاهز' : 'في الطريق'}</span></td>
              <td style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn btn--primary btn--sm" data-action="on-the-way" ${o.status !== 'ready' ? 'disabled' : ''}>في الطريق 🛵</button>
                <button class="btn btn--primary btn--sm" data-action="delivered" ${o.status !== 'on_the_way' ? 'disabled' : ''}>تم التسليم ✅</button>
                <button class="btn btn--ghost btn--sm" data-action="cancel" style="color:var(--c-error)">ملغي ❌</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>`;

    tableEl.querySelectorAll('tr[data-id]').forEach(row => {
      const orderId = row.dataset.id;

      row.querySelector('[data-action="on-the-way"]').addEventListener('click', async (e) => {
        await this.#runAction(e.target, () => this.#useCases.updateOrderStatus.execute({ orderId }), outlet);
      });
      row.querySelector('[data-action="delivered"]').addEventListener('click', async (e) => {
        await this.#runAction(e.target, () => this.#useCases.updateOrderStatus.execute({ orderId }), outlet);
      });
      row.querySelector('[data-action="cancel"]').addEventListener('click', async (e) => {
        if (!confirm('متأكد إنك عايز تلغي الطلب ده؟')) return;
        await this.#runAction(e.target, () => this.#useCases.cancelOrder.execute({ orderId }), outlet);
      });
    });
  }

  async #runAction(btn, action, outlet) {
    btn.disabled = true;
    try {
      await action();
      await this.#loadOrders(outlet);
    } catch (err) {
      this.#notification?.notify(err.message, 'error');
      btn.disabled = false;
    }
  }
}
