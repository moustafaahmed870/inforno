import { Pizza } from '../../../domain/entities/Pizza.js';

/** Creates a new pizza or fully overwrites an existing one */
export class SavePizzaUseCase {
  #pizzaRepo;
  constructor({ pizzaRepo }) { this.#pizzaRepo = pizzaRepo; }

  /** @param {Object} data raw form data — id optional, generated if missing */
  async execute(data) {
    const id = data.id || `pizza-${Date.now()}`;
    const pizza = new Pizza({ ...data, id, images: data.images ?? [] });
    if (data.isAvailable === false) pizza.disable();
    await this.#pizzaRepo.save(pizza);
    return pizza;
  }
}

/** Deletes a pizza by id */
export class DeletePizzaUseCase {
  #pizzaRepo;
  constructor({ pizzaRepo }) { this.#pizzaRepo = pizzaRepo; }
  async execute(id) { await this.#pizzaRepo.delete(id); }
}

/** Toggles availability (show/hide from the public menu without deleting) */
export class TogglePizzaAvailabilityUseCase {
  #pizzaRepo;
  constructor({ pizzaRepo }) { this.#pizzaRepo = pizzaRepo; }

  async execute(id) {
    const pizza = await this.#pizzaRepo.findById(id);
    if (!pizza) throw new Error('الصنف غير موجود');
    pizza.isAvailable ? pizza.disable() : pizza.enable();
    await this.#pizzaRepo.save(pizza);
    return pizza;
  }
}
