/**
 * @module GetTopSellingPizzasUseCase
 * Ranks available pizzas by units actually sold (from real orders) —
 * the same aggregation the admin dashboard uses for "أكثر البيتزا مبيعاً".
 * Falls back to rating/reviewCount for ties or when there's no order history yet
 * (e.g. a brand-new restaurant with an empty orders collection).
 */
export class GetTopSellingPizzasUseCase {
  #orderRepo; #pizzaRepo;
  constructor({ orderRepo, pizzaRepo }) {
    this.#orderRepo = orderRepo;
    this.#pizzaRepo = pizzaRepo;
  }

  async execute(limit = 3) {
    const [orders, allPizzas] = await Promise.all([
      this.#orderRepo.findAll(),
      this.#pizzaRepo.findAll(),
    ]);

    const soldCountByPizzaId = {};
    orders.forEach(order => {
      if (order.status.value === 'cancelled') return;
      order.items.forEach(item => {
        soldCountByPizzaId[item.pizzaId] = (soldCountByPizzaId[item.pizzaId] || 0) + item.quantity;
      });
    });

    return allPizzas
      .filter(p => p.isAvailable)
      .map(p => ({ pizza: p, sold: soldCountByPizzaId[p.id] || 0 }))
      .sort((a, b) => b.sold - a.sold || b.pizza.reviewCount - a.pizza.reviewCount)
      .slice(0, limit)
      .map(r => r.pizza);
  }
}
