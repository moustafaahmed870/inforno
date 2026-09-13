/**
 * @module KitchenPage
 * Real-time kitchen dashboard — Kanban board, auto-refreshes every 5s
 */
export class KitchenPage {
  #useCases; #notification; #pollInterval = null;

  static COLUMNS = [
    { status: 'pending',   label: 'قيد الانتظار', icon: '⏳', cls: 'col--pending'  },
    { status: 'preparing', label: 'يتحضر',         icon: '👨‍🍳', cls: 'col--preparing'},
    { status: 'baking',    label: 'في الفرن',       icon: '🔥', cls: 'col--baking'   },
    { status: 'ready',     label: 'جاهز',           icon: '📦', cls: 'col--ready'    },
  ];

  constructor({ useCases, notification }) {
    this.#useCases    = useCases;
    this.#notification = notification;
  }

  async render(outlet) {
    outlet.innerHTML = `
      <div class="page container kitchen-page">
        <header class="kitchen-header">
          <h1 class="section-title">لوحة المطبخ 👨‍🍳</h1>
          <div class="kitchen-live">
            <span class="live-dot"></span> مباشر
            <span id="kitchenTime" class="kitchen-time"></span>
          </div>
        </header>

        <div class="kanban-board" id="kanbanBoard">
          ${KitchenPage.COLUMNS.map(col => `
            <div class="kanban-col card ${col.cls}" data-status="${col.status}">
              <div class="kanban-col__header">
                <span>${col.icon} ${col.label}</span>
                <span class="kanban-count" id="count-${col.status}">0</span>
              </div>
              <div class="kanban-col__cards" id="col-${col.status}"></div>
            </div>
          `).join('')}
        </div>
      </div>`;

    this.#startClock(outlet);
    await this.#refresh(outlet);
    this.#pollInterval = setInterval(() => this.#refresh(outlet), 5000);
    window.addEventListener('hashchange', () => clearInterval(this.#pollInterval), { once: true });
  }

  async #refresh(outlet) {
    try {
      const allOrders = await this.#useCases.getOrders.execute();
      KitchenPage.COLUMNS.forEach(col => {
        const orders = allOrders.filter(o => o.status === col.status);
        const colEl  = outlet.querySelector(`#col-${col.status}`);
        const countEl= outlet.querySelector(`#count-${col.status}`);
        if (!colEl) return;
        countEl.textContent = orders.length;
        colEl.innerHTML = orders.length
          ? orders.map(o => this.#orderCard(o)).join('')
          : `<p class="kanban-empty">لا توجد طلبات</p>`;
      });

      this.#attachAdvanceButtons(outlet);
    } catch (e) {
      console.error('Kitchen refresh error:', e);
    }
  }

  #orderCard(order) {
    const age     = Math.floor((Date.now() - new Date(order.createdAt)) / 60000);
    const urgency = age > 20 ? 'urgent' : age > 10 ? 'warning' : 'normal';
    return `
      <div class="kanban-card hover-lift" data-order-id="${order.id}">
        <div class="kanban-card__header">
          <span class="kanban-card__id">${order.id.slice(-8)}</span>
          <span class="kanban-card__age badge badge--${urgency === 'urgent' ? 'red' : urgency === 'warning' ? 'gold' : 'muted'}">
            ${age} د
          </span>
        </div>
        <p class="kanban-card__customer">👤 ${order.customerName}</p>
        <ul class="kanban-card__items">
          ${order.items.map(i => `<li>${i.pizzaName} × ${i.quantity}</li>`).join('')}
        </ul>
        <div class="kanban-card__footer">
          <span>${order.isDelivery ? '🛵 توصيل' : '🏪 استلام'}</span>
          ${order.status !== 'ready' ? `
            <button class="btn btn--primary btn--sm advance-btn" data-id="${order.id}">
              التالي ←
            </button>` : `
            <span class="badge badge--green">✅ جاهز</span>`}
        </div>
      </div>`;
  }

  #attachAdvanceButtons(outlet) {
    outlet.querySelectorAll('.advance-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        try {
          await this.#useCases.updateOrderStatus.execute({ orderId: btn.dataset.id });
          await this.#refresh(outlet);
        } catch (err) {
          this.#notification.notify(err.message, 'error');
          btn.disabled = false;
        }
      });
    });
  }

  #startClock(outlet) {
    const el = outlet.querySelector('#kitchenTime');
    const tick = () => {
      if (el) el.textContent = new Date().toLocaleTimeString('ar-EG');
    };
    tick();
    setInterval(tick, 1000);
  }
}
