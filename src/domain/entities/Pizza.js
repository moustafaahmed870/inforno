import { Money } from '../value-objects/Money.js';

/**
 * @module Pizza
 * Domain Entity — aggregate root for menu items
 */
export class Pizza {
  #id; #name; #description; #price; #category;
  #ingredients; #heatLevel; #isAvailable; #badge; #rating; #reviewCount; #images;

  constructor({ id, name, description, price, category, ingredients, heatLevel, badge = null, rating = 0, reviewCount = 0, images = [], image = null }) {
    this.#validate({ name, heatLevel, ingredients });
    this.#id          = id;
    this.#name        = name.trim();
    this.#description = description?.trim() ?? '';
    this.#price       = price instanceof Money ? price : new Money(price);
    this.#category    = category;
    this.#ingredients = Object.freeze([...ingredients]);
    this.#heatLevel   = heatLevel;
    this.#isAvailable = true;
    this.#badge       = badge;
    this.#rating      = rating;
    this.#reviewCount = reviewCount;
    // Accepts either the new `images` array (up to 3) or the old single `image`
    // string (for pizzas saved before this field existed) — never both mixed up.
    const list = images.length ? images : (image ? [image] : []);
    this.#images = Object.freeze(list.slice(0, 3));
  }

  // ── Accessors ─────────────────────────────────────────────────────────────
  get id()          { return this.#id; }
  get name()        { return this.#name; }
  get description() { return this.#description; }
  get price()       { return this.#price; }
  get category()    { return this.#category; }
  get ingredients() { return this.#ingredients; }
  get heatLevel()   { return this.#heatLevel; }
  get isAvailable() { return this.#isAvailable; }
  get badge()       { return this.#badge; }
  get rating()      { return this.#rating; }
  get reviewCount() { return this.#reviewCount; }
  get images()      { return this.#images; }
  /** Convenience — first image, for anywhere a single cover photo is needed */
  get image()       { return this.#images[0] ?? null; }

  // ── Behaviour ─────────────────────────────────────────────────────────────
  enable()  { this.#isAvailable = true; }
  disable() { this.#isAvailable = false; }

  addReview(rating) {
    if (rating < 1 || rating > 5) throw new Error('التقييم يجب أن يكون بين 1 و 5');
    const total = this.#rating * this.#reviewCount + rating;
    this.#reviewCount += 1;
    this.#rating = Math.round((total / this.#reviewCount) * 10) / 10;
  }

  // ── Validation ────────────────────────────────────────────────────────────
  #validate({ name, heatLevel, ingredients }) {
    if (!name?.trim() || name.trim().length < 2) throw new Error('اسم البيتزا يجب أن يكون على الأقل حرفين');
    if (!Number.isInteger(heatLevel) || heatLevel < 0 || heatLevel > 5)
      throw new Error('مستوى الحرارة يجب أن يكون بين 0 و 5');
    if (!Array.isArray(ingredients) || ingredients.length === 0)
      throw new Error('يجب إضافة مكون واحد على الأقل');
  }

  // ── Serialization ─────────────────────────────────────────────────────────
  toDTO() {
    return {
      id: this.#id, name: this.#name, description: this.#description,
      price: this.#price.amount, currency: this.#price.currency,
      category: this.#category, ingredients: [...this.#ingredients],
      heatLevel: this.#heatLevel, isAvailable: this.#isAvailable,
      badge: this.#badge, rating: this.#rating, reviewCount: this.#reviewCount,
      images: [...this.#images], image: this.image,
    };
  }

  static fromDTO(dto) {
    const pizza = new Pizza({ ...dto, price: new Money(dto.price, dto.currency) });
    if (!dto.isAvailable) pizza.disable();
    return pizza;
  }
}
