/**
 * @module Footer
 * Persistent site footer — brand + newsletter, link columns, copyright bar
 */
export class Footer {
  #notification;
  constructor({ notification } = {}) { this.#notification = notification; }

  mount() {
    const footer = this.#render();
    document.body.appendChild(footer);
    this.#attachEvents(footer);
  }

  #render() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML = `
      <div class="container site-footer__top">
        <div class="footer-col footer-col--help">
          <h4>مساعدة</h4>
          <ul>
            <li><a href="#/tracking">تتبع طلبك</a></li>
            <li><a href="#/menu">الأسئلة الشائعة</a></li>
            <li><a href="#/">سياسة الاسترجاع</a></li>
          </ul>
        </div>

        <div class="footer-col footer-col--company">
          <h4>المطعم</h4>
          <ul>
            <li><a href="#/">من نحن</a></li>
            <li><a href="#/">تواصل معنا</a></li>
            <li><a href="#/">وظائف</a></li>
          </ul>
        </div>

        <div class="footer-col footer-col--shop">
          <h4>القائمة</h4>
          <ul>
            <li><a href="#/menu">كل الأصناف</a></li>
            <li><a href="#/menu">بيتزا كلاسيك</a></li>
            <li><a href="#/menu">العروض المميزة</a></li>
          </ul>
        </div>

        <div class="footer-col footer-col--brand">
          <h3 class="footer-brand">Inferno 🍕</h3>
          <p class="footer-brand__desc">
            مطعم بيتزا إيطالي أصيل، عجينة طازجة وفرن حجري ساخن كل يوم من قلب المدينة لباب بيتك.
          </p>
          <form class="footer-newsletter" id="footerNewsletter">
            <button type="submit" class="btn btn--primary footer-newsletter__btn">اشترك</button>
            <input type="email" required placeholder="بريدك الإلكتروني" class="footer-newsletter__input" />
          </form>
        </div>
      </div>

      <div class="container site-footer__bottom">
        <p>© ${new Date().getFullYear()} Inferno. جميع الحقوق محفوظة.</p>
      </div>`;
    return footer;
  }

  #attachEvents(footer) {
    const form = footer.querySelector('#footerNewsletter');
    form?.addEventListener('submit', e => {
      e.preventDefault();
      form.reset();
      this.#notification?.notify?.('تم الاشتراك في النشرة البريدية بنجاح 🍕', 'success');
    });
  }
}
