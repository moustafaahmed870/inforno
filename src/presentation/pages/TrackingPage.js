import { OrderStatus } from '../../domain/value-objects/OrderStatus.js';

/**
 * @module TrackingPage
 * Live order tracker — polls every 5s, renders status timeline
 */
export class TrackingPage {
  #useCases; #pollInterval = null;

  constructor({ useCases }) { this.#useCases = useCases; }

  async render(outlet) {
    const orderId = localStorage.getItem('last_order_id');

    if (!orderId) {
      outlet.innerHTML = `
        <div class="page container">
          <div class="empty-state">
            <div class="empty-state__icon">🔍</div>
            <p class="empty-state__title">لا يوجد طلب نشط</p>
            <a href="#/menu" class="btn btn--primary">اطلب الآن</a>
          </div>
        </div>`;
      return;
    }

    outlet.innerHTML = `
      <div class="page container tracking-page">
        <div class="tracking-header fade-up">
          <h1 class="section-title">تتبع طلبك</h1>
          <p class="tracking-id">رقم الطلب: <strong>${orderId}</strong></p>
        </div>

        <div class="tracking-card card card--raised fade-up" id="trackingCard">
          <div class="pizza-spin" style="margin:auto;font-size:3rem;padding:40px 0">🍕</div>
        </div>

        <div class="tracking-details card card--raised fade-up" id="trackingDetails"></div>
      </div>`;

    await this.#loadOrder(outlet, orderId);
    this.#pollInterval = setInterval(() => this.#loadOrder(outlet, orderId), 5000);

    // Cleanup when navigating away
    window.addEventListener('hashchange', () => clearInterval(this.#pollInterval), { once: true });
  }

  async #loadOrder(outlet, orderId) {
    try {
      const order = await this.#useCases.getOrderById.execute(orderId);
      if (!order) return;

      if (order.status === 'delivered') {
        this.#renderDelivered(outlet, order);
        clearInterval(this.#pollInterval); // no need to keep polling once it's done
        return;
      }
      if (order.status === 'cancelled') {
        this.#renderCancelled(outlet, order);
        clearInterval(this.#pollInterval);
        return;
      }

      this.#renderTracker(outlet, order);
    } catch (e) {
      console.error('Tracking error:', e);
    }
  }

  #renderDelivered(outlet, order) {
    const card = outlet.querySelector('#trackingCard');
    const det  = outlet.querySelector('#trackingDetails');
    if (!card || !det) return;

    card.innerHTML = `
      <div class="tracker-status">
        <div class="tracker-status__icon">✅</div>
        <h2 class="tracker-status__label">تم توصيل طلبك بنجاح</h2>
        <p class="text-muted" style="margin-top:var(--sp-2)">بالهنا والشفا، نتشرف بطلبك تاني 🍕</p>
      </div>`;
    det.innerHTML = '';
  }

  #renderCancelled(outlet, order) {
    const card = outlet.querySelector('#trackingCard');
    const det  = outlet.querySelector('#trackingDetails');
    if (!card || !det) return;

    card.innerHTML = `
      <div class="tracker-status">
        <div class="tracker-status__icon">❌</div>
        <h2 class="tracker-status__label">تم إلغاء هذا الطلب</h2>
        <p class="text-muted" style="margin-top:var(--sp-2)">لو ده حصل بالغلط، تواصل معانا مباشرة</p>
      </div>`;
    det.innerHTML = '';
  }

  #renderTracker(outlet, order) {
    const steps   = OrderStatus.allSteps().filter(s => s.value !== 'cancelled');
    const currIdx = steps.findIndex(s => s.value === order.status);

    const card = outlet.querySelector('#trackingCard');
    const det  = outlet.querySelector('#trackingDetails');
    if (!card || !det) return;

    card.innerHTML = `
      <div class="tracker-status">
        <div class="tracker-status__icon">${steps[currIdx]?.icon ?? '⏳'}</div>
        <h2 class="tracker-status__label">${order.status_label ?? steps[currIdx]?.label}</h2>
      </div>

      <div class="timeline-3d">
        ${steps.map((step, i) => `
          <div class="timeline-3d__step ${i < currIdx ? 'done' : ''} ${i === currIdx ? 'active' : ''}">
            <div class="timeline-step__dot">${step.icon}</div>
            <p class="timeline-step__label">${step.label}</p>
          </div>
        `).join('')}
      </div>

      <div class="tracker-progress">
        <div class="progress-bar">
          <div class="progress-bar__fill" style="width:${Math.round(((currIdx + 1) / steps.length) * 100)}%"></div>
        </div>
      </div>`;

    det.innerHTML = `
      <div class="tracking-info-grid">
        <div class="info-item"><span>العميل</span><strong>${order.customerName}</strong></div>
        <div class="info-item"><span>الهاتف</span><strong>${order.customerPhone}</strong></div>
        <div class="info-item"><span>نوع الخدمة</span><strong>${order.isDelivery ? '🛵 توصيل' : '🏪 استلام'}</strong></div>
        <div class="info-item"><span>الإجمالي</span><strong>${order.total} ج</strong></div>
      </div>
      <div class="tracking-items">
        <h4>محتويات الطلب</h4>
        ${order.items.map(i => `
          <div class="summary-item">
            <span>${i.pizzaName} × ${i.quantity}</span>
            <span>${i.subtotal} ج</span>
          </div>`).join('')}
      </div>`;
  }
}
