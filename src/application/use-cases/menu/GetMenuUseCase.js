/** Returns available pizzas, optionally filtered by category */
export class GetMenuUseCase {
  #pizzaRepo;
  constructor({ pizzaRepo }) { this.#pizzaRepo = pizzaRepo; }

  /**
   * @param {{ category?: string }} [params]
   * @returns {Promise<Object[]>} array of PizzaDTO
   */
  async execute({ category = 'all' } = {}) {
    const pizzas = category === 'all'
      ? await this.#pizzaRepo.findAll()
      : await this.#pizzaRepo.findByCategory(category);

    return pizzas
      .filter(p => p.isAvailable)
      .map(p => p.toDTO());
  }
}

/** Admin-only: returns EVERY pizza regardless of availability, so hidden items can be managed */
export class GetAllPizzasForAdminUseCase {
  #pizzaRepo;
  constructor({ pizzaRepo }) { this.#pizzaRepo = pizzaRepo; }

  async execute() {
    const pizzas = await this.#pizzaRepo.findAll();
    return pizzas.map(p => p.toDTO());
  }
}

/** Returns a single pizza's full details (for the product detail page) */
export class GetPizzaByIdUseCase {
  #pizzaRepo;
  constructor({ pizzaRepo }) { this.#pizzaRepo = pizzaRepo; }

  async execute(id) {
    const pizza = await this.#pizzaRepo.findById(id);
    return pizza ? pizza.toDTO() : null;
  }
}
