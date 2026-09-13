/**
 * @module Address
 * Value Object — immutable delivery address
 */
export class Address {
  #street; #city; #notes;

  constructor({ street, city, notes = '' }) {
    if (!street?.trim()) throw new Error('العنوان مطلوب');
    if (!city?.trim())   throw new Error('المدينة مطلوبة');
    this.#street = street.trim();
    this.#city   = city.trim();
    this.#notes  = notes.trim();
    Object.freeze(this);
  }

  get street() { return this.#street; }
  get city()   { return this.#city; }
  get notes()  { return this.#notes; }
  get full()   { return `${this.#street}، ${this.#city}`; }

  equals(other) {
    return this.#street === other?.#street && this.#city === other?.#city;
  }

  toJSON() { return { street: this.#street, city: this.#city, notes: this.#notes }; }
  static fromJSON(data) { return new Address(data); }
}
