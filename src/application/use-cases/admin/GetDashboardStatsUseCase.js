/**
 * @module GetDashboardStatsUseCase
 * Aggregates order data into dashboard statistics
 */
export class GetDashboardStatsUseCase {
  #orderRepo;
  constructor({ orderRepo }) { this.#orderRepo = orderRepo; }

  async execute() {
    const orders   = await this.#orderRepo.findAll();
    const today    = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);

    const revenue = todayOrders
      .filter(o => o.status.value !== 'cancelled')
      .reduce((sum, o) => sum + o.total.amount, 0);

    const pizzaCount = todayOrders.reduce((sum, o) =>
      sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

    const topPizzas = this.#calcTopPizzas(orders);
    const statusBreakdown = this.#calcStatusBreakdown(orders);
    const weeklyRevenue   = this.#calcWeeklyRevenue(orders);

    return {
      today: {
        revenue:    Math.round(revenue * 100) / 100,
        orders:     todayOrders.length,
        pizzaCount,
        avgOrderValue: todayOrders.length ? Math.round(revenue / todayOrders.length) : 0,
      },
      topPizzas,
      statusBreakdown,
      weeklyRevenue,
    };
  }

  #calcTopPizzas(orders) {
    const counts = {};
    orders.forEach(o =>
      o.items.forEach(i => {
        counts[i.pizzaName] = (counts[i.pizzaName] || 0) + i.quantity;
      })
    );
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }

  #calcStatusBreakdown(orders) {
    const counts = {};
    orders.forEach(o => { counts[o.status.value] = (counts[o.status.value] || 0) + 1; });
    return counts;
  }

  #calcWeeklyRevenue(orders) {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toDateString();
    });
    return days.map(day => ({
      day: new Date(day).toLocaleDateString('ar-EG', { weekday: 'short' }),
      revenue: orders
        .filter(o => new Date(o.createdAt).toDateString() === day && o.status.value !== 'cancelled')
        .reduce((sum, o) => sum + o.total.amount, 0),
    }));
  }
}
