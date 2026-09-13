/**
 * @module container
 * Composition Root — the ONLY place where dependencies are wired together
 * All other modules receive their dependencies; they don't instantiate them
 */

// ── Infrastructure ────────────────────────────────────────────────────────────
import { FirestorePizzaRepository }    from './infrastructure/repositories/FirestorePizzaRepository.js';
import { FirestoreOrderRepository }    from './infrastructure/repositories/FirestoreOrderRepository.js';
import { FirestoreContentRepository }  from './infrastructure/repositories/FirestoreContentRepository.js';
import { FirebaseAuthService }         from './infrastructure/services/FirebaseAuthService.js';
import { NotificationService }         from './infrastructure/services/NotificationService.js';

// ── Domain ────────────────────────────────────────────────────────────────────
import { Pizza }                       from './domain/entities/Pizza.js';

// ── Presentation State ────────────────────────────────────────────────────────
import { store }                       from './presentation/state/Store.js';
import { CartState }                   from './presentation/state/CartState.js';

// ── Application Use Cases ─────────────────────────────────────────────────────
import { GetMenuUseCase, GetAllPizzasForAdminUseCase, GetPizzaByIdUseCase } from './application/use-cases/menu/GetMenuUseCase.js';
import { GetTopSellingPizzasUseCase }  from './application/use-cases/menu/GetTopSellingPizzasUseCase.js';
import { SavePizzaUseCase, DeletePizzaUseCase, TogglePizzaAvailabilityUseCase }
                                        from './application/use-cases/menu/ManagePizzaUseCases.js';
import { PlaceOrderUseCase }           from './application/use-cases/order/PlaceOrderUseCase.js';
import { UpdateOrderStatusUseCase }    from './application/use-cases/order/UpdateOrderStatusUseCase.js';
import { CancelOrderUseCase }          from './application/use-cases/order/CancelOrderUseCase.js';
import { GetOrdersUseCase }            from './application/use-cases/order/GetOrdersUseCase.js';
import { GetOrderByIdUseCase }         from './application/use-cases/order/GetOrderByIdUseCase.js';
import { GetDashboardStatsUseCase }    from './application/use-cases/admin/GetDashboardStatsUseCase.js';
import { GetHomeContentUseCase, UpdateHomeContentUseCase }
                                        from './application/use-cases/content/ContentUseCases.js';
import { LoginUseCase, LogoutUseCase, GetCurrentUserUseCase }
                                        from './application/use-cases/auth/AuthUseCases.js';
import {
  AddToCartUseCase, RemoveFromCartUseCase,
  UpdateCartQuantityUseCase, ClearCartUseCase, GetCartUseCase,
} from './application/use-cases/cart/CartUseCases.js';

// ── Instantiation (order matters: repos → services → state → use cases) ───────

const pizzaRepo    = new FirestorePizzaRepository();
const orderRepo    = new FirestoreOrderRepository();
const contentRepo  = new FirestoreContentRepository();
const authService  = new FirebaseAuthService();
const notification = new NotificationService();
const cartState    = new CartState(store);

// Expose Pizza class for seed data / admin tools
window.__domain__ = { Pizza };

export const useCases = Object.freeze({
  // Menu (public)
  getMenu:             new GetMenuUseCase({ pizzaRepo }),
  getPizzaById:        new GetPizzaByIdUseCase({ pizzaRepo }),
  getTopSelling:       new GetTopSellingPizzasUseCase({ orderRepo, pizzaRepo }),

  // Menu (admin)
  getAllPizzas:        new GetAllPizzasForAdminUseCase({ pizzaRepo }),
  savePizza:           new SavePizzaUseCase({ pizzaRepo }),
  deletePizza:         new DeletePizzaUseCase({ pizzaRepo }),
  togglePizza:         new TogglePizzaAvailabilityUseCase({ pizzaRepo }),

  // Cart
  addToCart:           new AddToCartUseCase({ pizzaRepo, cartState }),
  removeFromCart:      new RemoveFromCartUseCase({ cartState }),
  updateCartQuantity:  new UpdateCartQuantityUseCase({ cartState }),
  clearCart:           new ClearCartUseCase({ cartState }),
  getCart:             new GetCartUseCase({ cartState }),

  // Orders
  placeOrder:          new PlaceOrderUseCase({ orderRepo, pizzaRepo, notificationService: notification }),
  updateOrderStatus:   new UpdateOrderStatusUseCase({ orderRepo, notificationService: notification }),
  cancelOrder:         new CancelOrderUseCase({ orderRepo, notificationService: notification }),
  getOrders:           new GetOrdersUseCase({ orderRepo }),
  getOrderById:        new GetOrderByIdUseCase({ orderRepo }),

  // Admin dashboard
  getDashboardStats:   new GetDashboardStatsUseCase({ orderRepo }),

  // Homepage content
  getHomeContent:      new GetHomeContentUseCase({ contentRepo }),
  updateHomeContent:   new UpdateHomeContentUseCase({ contentRepo }),

  // Auth
  login:               new LoginUseCase({ authService }),
  logout:              new LogoutUseCase({ authService }),
  getCurrentUser:      new GetCurrentUserUseCase({ authService }),
});

export { store, cartState, notification, pizzaRepo, authService };
