/**
 * @module app
 * Application bootstrap — wires Router + Navbar + CartSidebar + pages
 * This is the ONLY file that imports from container.js
 */
import { useCases, cartState, notification, authService } from './src/container.js';
import { Router }      from './src/presentation/router/Router.js';
import { Navbar }      from './src/presentation/components/ui/Navbar.js';
import { Footer }      from './src/presentation/components/ui/Footer.js';
import { CartSidebar } from './src/presentation/components/ui/CartSidebar.js';

// ── Bootstrap ──────────────────────────────────────────────────────────────
async function bootstrap() {
  const outlet = document.getElementById('app');
  const router  = new Router(outlet);

  // Mount persistent shell components
  new Navbar({ cartState, router }).mount();
  new CartSidebar({ cartState, useCases, router }).mount();
  new Footer({ notification }).mount();

  // Shared page deps
  const pageDeps = { useCases, cartState, router, notification };

  // Wraps a page factory so the route only renders for a signed-in admin;
  // otherwise it redirects to #/login (and remembers where to return to).
  const requireAdmin = (loadPage) => async () => {
    const user = await useCases.getCurrentUser.execute();
    if (!user?.isAdmin) {
      sessionStorage.setItem('auth_redirect', window.location.hash || '#/admin');
      router.navigate('#/login');
      return { render: (el) => { el.innerHTML = '<div class="page-loader"><div class="pizza-spin">🍕</div></div>'; } };
    }
    return loadPage();
  };

  // Register routes
  router
    .on('#/',         async () => { const { HomePage }     = await import('./src/presentation/pages/HomePage.js');     return new HomePage(pageDeps); })
    .on('#/menu',     async () => { const { MenuPage }     = await import('./src/presentation/pages/MenuPage.js');     return new MenuPage(pageDeps); })
    .on('#/menu/:id', async (params) => { const { ProductPage } = await import('./src/presentation/pages/ProductPage.js'); return new ProductPage({ ...pageDeps, pizzaId: params.id }); })
    .on('#/checkout', async () => { const { CheckoutPage } = await import('./src/presentation/pages/CheckoutPage.js'); return new CheckoutPage(pageDeps); })
    .on('#/tracking', async () => { const { TrackingPage } = await import('./src/presentation/pages/TrackingPage.js'); return new TrackingPage(pageDeps); })
    .on('#/login',    async () => { const { LoginPage }    = await import('./src/presentation/pages/LoginPage.js');    return new LoginPage(pageDeps); })
    .on('#/kitchen',  requireAdmin(async () => { const { KitchenPage }  = await import('./src/presentation/pages/KitchenPage.js');  return new KitchenPage(pageDeps); }))
    .on('#/delivery', requireAdmin(async () => { const { DeliveryPage } = await import('./src/presentation/pages/DeliveryPage.js'); return new DeliveryPage(pageDeps); }))
    .on('#/admin',    requireAdmin(async () => { const { AdminPage }    = await import('./src/presentation/pages/AdminPage.js');    return new AdminPage(pageDeps); }))
    .notFound(async () => ({
      render: (el) => {
        el.innerHTML = `<div class="page container empty-state">
          <div class="empty-state__icon">🍕</div>
          <p class="empty-state__title">الصفحة مش موجودة</p>
          <a href="#/" class="btn btn--primary">الرئيسية</a></div>`;
      },
    }))
    .start();
}

bootstrap().catch(err => {
  console.error('Bootstrap failed:', err);
  document.getElementById('app').innerHTML =
    `<div style="padding:40px;text-align:center;color:#EF4444">
      <h2>خطأ في تشغيل التطبيق</h2><p>${err.message}</p>
    </div>`;
});
