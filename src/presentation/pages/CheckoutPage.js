/**
 * @module CheckoutPage
 * Order form — validates, calls PlaceOrderUseCase, redirects to tracking
 */
export class CheckoutPage {
  #useCases; #cartState; #router; #notification;

  constructor({ useCases, cartState, router, notification }) {
    this.#useCases    = useCases;
    this.#cartState   = cartState;
    this.#router      = router;
    this.#notification = notification;
  }

  async render(outlet) {
    const cart = this.#cartState.snapshot;

    if (!cart.items.length) {
      outlet.innerHTML = `
        <div class="page container">
          <div class="empty-state">
            <div class="empty-state__icon">🛒</div>
            <p class="empty-state__title">السلة فارغة</p>
            <a href="#/menu" class="btn btn--primary">ارجع للقائمة</a>
          </div>
        </div>`;
      return;
    }

    outlet.innerHTML = `
      <div class="page container checkout-page">
        <h1 class="section-title fade-up">إتمام الطلب</h1>

        <div class="checkout-layout">

          <!-- Form -->
          <div class="checkout-form card card--raised fade-up">
            <h2 class="checkout-form__title">بياناتك</h2>

            <div class="form-group">
              <label class="form-label" for="custName">الاسم</label>
              <input class="form-input" id="custName" placeholder="محمد أحمد" required>
              <span class="form-error" id="custNameErr"></span>
            </div>

            <div class="form-group">
              <label class="form-label" for="custPhone">رقم الهاتف</label>
              <input class="form-input" id="custPhone" type="tel" inputmode="numeric" maxlength="11" placeholder="01xxxxxxxxx" required>
              <span class="form-error" id="custPhoneErr"></span>
            </div>

            <div class="checkout-delivery-toggle">
              <button class="delivery-mode-btn active" data-mode="delivery" id="modeDelivery">🛵 توصيل</button>
              <button class="delivery-mode-btn" data-mode="pickup" id="modePickup">🏪 استلام</button>
            </div>

            <div id="addressSection">
              <div class="form-group">
                <label class="form-label" for="custStreet">العنوان</label>
                <input class="form-input" id="custStreet" placeholder="الشارع، المبنى، الطابق">
                <span class="form-error" id="custStreetErr"></span>
              </div>
              <div class="form-group">
                <label class="form-label" for="custCity">المدينة</label>
                <input class="form-input" id="custCity" placeholder="القاهرة">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="custNotes">ملاحظات (اختياري)</label>
              <textarea class="form-input" id="custNotes" rows="3" placeholder="أي طلبات خاصة..."></textarea>
            </div>

            <button class="btn btn--primary btn--full btn--lg glow-pulse" id="placeOrderBtn">
              تأكيد الطلب 🍕
            </button>
            <p class="checkout-form__secure">🔒 بياناتك آمنة</p>
          </div>

          <!-- Summary -->
          <div class="checkout-summary fade-up">
            <div class="card card--raised checkout-summary__card">
              <h3 class="checkout-summary__title">ملخص الطلب</h3>
              ${cart.items.map(item => `
                <div class="summary-item">
                  <span>${item.pizza.name} × ${item.quantity}</span>
                  <span>${(item.pizza.price * item.quantity).toFixed(0)} ج</span>
                </div>`).join('')}
              <hr class="divider">
              <div class="summary-item"><span>مجموع</span><span>${cart.subtotal.toFixed(2)} ج</span></div>
              <div class="summary-item"><span>ضريبة</span><span>${cart.tax.toFixed(2)} ج</span></div>
              <div class="summary-item" id="summaryDelivery">
                <span>توصيل</span><span>${cart.deliveryFee > 0 ? cart.deliveryFee + ' ج' : 'مجاني'}</span>
              </div>
              <hr class="divider">
              <div class="summary-item summary-item--total">
                <strong>الإجمالي</strong>
                <strong id="summaryTotal">${cart.total.toFixed(2)} ج</strong>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    this.#attachEvents(outlet, cart);
  }

  #attachEvents(outlet, cart) {
    let isDelivery = true;

    // Delivery toggle
    outlet.querySelectorAll('.delivery-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        outlet.querySelectorAll('.delivery-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        isDelivery = btn.dataset.mode === 'delivery';
        outlet.querySelector('#addressSection').style.display = isDelivery ? '' : 'none';
        this.#useCases.updateCartQuantity; // recalc via cartState
        this.#cartState.setDeliveryMode(isDelivery);
        // Update summary
        const snap = this.#cartState.snapshot;
        outlet.querySelector('#summaryTotal').textContent   = snap.total.toFixed(2) + ' ج';
        outlet.querySelector('#summaryDelivery').lastElementChild.textContent =
          snap.deliveryFee > 0 ? snap.deliveryFee + ' ج' : 'مجاني';
      });
    });

    // Phone: digits only, capped at 11 while typing
    const phoneInput = outlet.querySelector('#custPhone');
    phoneInput.addEventListener('input', () => {
      phoneInput.value = phoneInput.value.replace(/\D/g, '').slice(0, 11);
    });

    // Submit
    outlet.querySelector('#placeOrderBtn').addEventListener('click', () =>
      this.#submit(outlet, isDelivery)
    );
  }

  #isValidEgyptianPhone(phone) {
    return /^(010|011|012|015)\d{8}$/.test(phone);
  }

  async #submit(outlet, isDelivery) {
    const name    = outlet.querySelector('#custName').value.trim();
    const phone   = outlet.querySelector('#custPhone').value.trim();
    const street  = outlet.querySelector('#custStreet')?.value.trim();
    const city    = outlet.querySelector('#custCity')?.value.trim();
    const notes   = outlet.querySelector('#custNotes').value.trim();

    // Client-side validation
    let valid = true;
    const setErr = (id, msg) => { outlet.querySelector(id).textContent = msg; valid = valid && !msg; };
    setErr('#custNameErr', name ? '' : 'الاسم مطلوب');

    let phoneErr = '';
    if (!phone) phoneErr = 'رقم الهاتف مطلوب';
    else if (!this.#isValidEgyptianPhone(phone)) phoneErr = 'رقم غير صحيح — لازم يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقم';
    setErr('#custPhoneErr', phoneErr);

    if (isDelivery) setErr('#custStreetErr', street ? '' : 'العنوان مطلوب');
    if (!valid) return;

    const btn = outlet.querySelector('#placeOrderBtn');
    btn.disabled    = true;
    btn.textContent = '⏳ جاري الإرسال...';

    try {
      const cart  = this.#cartState.snapshot;
      const order = await this.#useCases.placeOrder.execute({
        cartItems:       cart.items.map(i => ({ pizzaId: i.pizza.id, quantity: i.quantity })),
        customerName:    name,
        customerPhone:   phone,
        deliveryAddress: isDelivery ? { street, city: city || 'القاهرة', notes } : null,
        notes, isDelivery,
      });

      await this.#useCases.clearCart.execute();
      localStorage.setItem('last_order_id', order.id);
      this.#router.navigate('#/tracking');
    } catch (err) {
      this.#notification.notify(err.message, 'error');
      btn.disabled    = false;
      btn.textContent = 'تأكيد الطلب 🍕';
    }
  }
}
