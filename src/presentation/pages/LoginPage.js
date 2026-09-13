/**
 * @module LoginPage
 * Staff login (admin/kitchen) — Firebase email/password auth
 */
export class LoginPage {
  #useCases; #router;
  constructor({ useCases, router }) { this.#useCases = useCases; this.#router = router; }

  async render(outlet) {
    outlet.innerHTML = `
      <div class="page container login-page">
        <form class="login-card card card--raised" id="loginForm">
          <h1 class="section-title" style="margin-bottom:var(--sp-2)">تسجيل دخول الموظفين</h1>
          <p class="text-muted" style="margin-bottom:var(--sp-6)">هذه الصفحة مخصصة لفريق العمل فقط 🔒</p>

          <label class="form-label">البريد الإلكتروني</label>
          <input type="email" class="form-input" id="loginEmail" required autocomplete="username" />

          <label class="form-label" style="margin-top:var(--sp-4)">كلمة المرور</label>
          <input type="password" class="form-input" id="loginPassword" required autocomplete="current-password" />

          <p class="form-error" id="loginError" hidden></p>

          <button type="submit" class="btn btn--primary btn--full" style="margin-top:var(--sp-6)" id="loginSubmit">
            دخول
          </button>
        </form>
      </div>`;

    this.#attachEvents(outlet);
  }

  #attachEvents(outlet) {
    const form   = outlet.querySelector('#loginForm');
    const errEl  = outlet.querySelector('#loginError');
    const submit = outlet.querySelector('#loginSubmit');

    form.addEventListener('submit', async e => {
      e.preventDefault();
      errEl.hidden = true;
      submit.disabled = true;
      submit.textContent = '...جاري الدخول';

      const email    = outlet.querySelector('#loginEmail').value.trim();
      const password = outlet.querySelector('#loginPassword').value;

      try {
        const user = await this.#useCases.login.execute(email, password);
        if (!user.isAdmin) {
          errEl.textContent = 'هذا الحساب غير مصرّح له بدخول لوحة الإدارة';
          errEl.hidden = false;
          await this.#useCases.logout.execute();
          return;
        }
        // Redirect to the page the user originally tried to reach, default admin
        const redirectTo = sessionStorage.getItem('auth_redirect') || '#/admin';
        sessionStorage.removeItem('auth_redirect');
        this.#router.navigate(redirectTo);
      } catch (err) {
        errEl.textContent = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
        errEl.hidden = false;
      } finally {
        submit.disabled = false;
        submit.textContent = 'دخول';
      }
    });
  }
}
