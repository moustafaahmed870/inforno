import { Money }       from '../value-objects/Money.js';
import { OrderStatus } from '../value-objects/OrderStatus.js';

// ── OrderItem ─────────────────────────────────────────────────────────────────
export class OrderItem {
  #pizzaId; #pizzaName; #unitPrice; #quantity;

  constructor({ pizzaId, pizzaName, unitPrice, quantity }) {
    if (!pizzaId)                               throw new Error('معرّف البيتزا مطلوب');
    if (quantity < 1 || !Number.isInteger(quantity)) throw new Error('الكمية يجب أن تكون رقماً صحيحاً أكبر من صفر');
    this.#pizzaId   = pizzaId;
    this.#pizzaName = pizzaName;
    this.#unitPrice = unitPrice instanceof Money ? unitPrice : new Money(unitPrice);
    this.#quantity  = quantity;
  }

  get pizzaId()   { return this.#pizzaId; }
  get pizzaName() { return this.#pizzaName; }
  get unitPrice() { return this.#unitPrice; }
  get quantity()  { return this.#quantity; }
  get subtotal()  { return this.#unitPrice.multiply(this.#quantity); }

  toDTO() {
    return {
      pizzaId: this.#pizzaId, pizzaName: this.#pizzaName,
      unitPrice: this.#unitPrice.amount, quantity: this.#quantity,
      subtotal: this.subtotal.amount,
    };
  }

  static fromDTO(dto) {
    return new OrderItem({ ...dto, unitPrice: new Money(dto.unitPrice) });
  }
}

// ── Order ─────────────────────────────────────────────────────────────────────
export class Order {
  #id; #items; #customerName; #customerPhone;
  #deliveryAddress; #status; #notes; #createdAt; #updatedAt;
  #deliveryFee; #isDelivery;

  static DELIVERY_FEE     = new Money(25);
  static FREE_DELIVERY_AT = new Money(200);

  constructor({ id, items, customerName, customerPhone, deliveryAddress = null, notes = '', isDelivery = true }) {
    if (!items?.length) throw new Error('الطلب يجب أن يحتوي على عنصر واحد على الأقل');
    if (!customerName?.trim()) throw new Error('اسم العميل مطلوب');
    if (!customerPhone?.trim()) throw new Error('رقم الهاتف مطلوب');

    this.#id              = id;
    this.#items           = items.map(i => i instanceof OrderItem ? i : OrderItem.fromDTO(i));
    this.#customerName    = customerName.trim();
    this.#customerPhone   = customerPhone.trim();
    this.#deliveryAddress = deliveryAddress;
    this.#notes           = notes.trim();
    this.#status          = OrderStatus.PENDING;
    this.#createdAt       = new Date();
    this.#updatedAt       = new Date();
    this.#isDelivery      = isDelivery;
    this.#deliveryFee     = this.#calcDeliveryFee();
  }

  // ── Accessors ─────────────────────────────────────────────────────────────
  get id()              { return this.#id; }
  get items()           { return [...this.#items]; }
  get customerName()    { return this.#customerName; }
  get customerPhone()   { return this.#customerPhone; }
  get deliveryAddress() { return this.#deliveryAddress; }
  get status()          { return this.#status; }
  get notes()           { return this.#notes; }
  get createdAt()       { return this.#createdAt; }
  get updatedAt()       { return this.#updatedAt; }
  get isDelivery()      { return this.#isDelivery; }
  get deliveryFee()     { return this.#deliveryFee; }

  get subtotal() {
    return this.#items.reduce((acc, item) => acc.add(item.subtotal), Money.zero());
  }

  get total() {
    return this.subtotal.add(this.#deliveryFee);
  }

  // ── Behaviour ─────────────────────────────────────────────────────────────
  advance() {
    if (!this.#status.canAdvance()) throw new Error('لا يمكن تحديث حالة هذا الطلب');
    this.#status    = this.#status.next();
    this.#updatedAt = new Date();
    return this.#status;
  }

  cancel() {
    if (!this.#status.canCancel()) throw new Error('لا يمكن إلغاء الطلب في هذه المرحلة');
    this.#status    = OrderStatus.CANCELLED;
    this.#updatedAt = new Date();
  }

  // ── Private ───────────────────────────────────────────────────────────────
  #calcDeliveryFee() {
    if (!this.#isDelivery) return Money.zero();
    return this.subtotal.isGreaterThan(Order.FREE_DELIVERY_AT)
      ? Money.zero()
      : Order.DELIVERY_FEE;
  }

  // ── Serialization ─────────────────────────────────────────────────────────
  toDTO() {
    return {
      id: this.#id,
      items: this.#items.map(i => i.toDTO()),
      customerName: this.#customerName,
      customerPhone: this.#customerPhone,
      deliveryAddress: this.#deliveryAddress?.toJSON?.() ?? this.#deliveryAddress,
      notes: this.#notes,
      status: this.#status.toJSON(),
      subtotal: this.subtotal.amount,
      deliveryFee: this.#deliveryFee.amount,
      total: this.total.amount,
      isDelivery: this.#isDelivery,
      createdAt: this.#createdAt.toISOString(),
      updatedAt: this.#updatedAt.toISOString(),
    };
  }

  static fromDTO(dto) {
    const order = new Order({
      ...dto,
      items: dto.items.map(OrderItem.fromDTO),
    });
    order.#status    = OrderStatus.fromValue(dto.status);
    order.#createdAt = new Date(dto.createdAt);
    order.#updatedAt = new Date(dto.updatedAt);
    return order;
  }
}
