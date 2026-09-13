/**
 * @module CartUseCases
 * All cart operations — use CartState (presentation) via interface
 */

export class AddToCartUseCase {
  #pizzaRepo; #cartState;
  constructor({ pizzaRepo, cartState }) { this.#pizzaRepo = pizzaRepo; this.#cartState = cartState; }

  async execute({ pizzaId, quantity = 1 }) {
    if (quantity < 1) throw new Error('الكمية يجب أن تكون واحد على الأقل');
    const pizza = await this.#pizzaRepo.findById(pizzaId);
    if (!pizza)            throw new Error('البيتزا غير موجودة');
    if (!pizza.isAvailable) throw new Error('البيتزا غير متاحة حالياً');
    this.#cartState.addItem({ pizza: pizza.toDTO(), quantity });
    return this.#cartState.snapshot;
  }
}

export class RemoveFromCartUseCase {
  #cartState;
  constructor({ cartState }) { this.#cartState = cartState; }
  execute({ pizzaId }) { this.#cartState.removeItem(pizzaId); return this.#cartState.snapshot; }
}

export class UpdateCartQuantityUseCase {
  #cartState;
  constructor({ cartState }) { this.#cartState = cartState; }
  execute({ pizzaId, quantity }) {
    if (quantity < 1) throw new Error('الكمية يجب أن تكون واحد على الأقل');
    this.#cartState.updateQuantity(pizzaId, quantity);
    return this.#cartState.snapshot;
  }
}

export class ClearCartUseCase {
  #cartState;
  constructor({ cartState }) { this.#cartState = cartState; }
  execute() { this.#cartState.clear(); return this.#cartState.snapshot; }
}

export class GetCartUseCase {
  #cartState;
  constructor({ cartState }) { this.#cartState = cartState; }
  execute() { return this.#cartState.snapshot; }
}
