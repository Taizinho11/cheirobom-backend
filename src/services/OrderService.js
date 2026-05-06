const { v4: uuidv4 } = require('uuid');
const store = require('../store');

function httpError(msg, status) {
  return Object.assign(new Error(msg), { status });
}

class OrderService {
  createFromCart(cart, customer = {}) {
    if (!cart.items.length) throw httpError('Le panier est vide', 400);

    const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;
    const order = {
      orderId,
      status: 'pending',
      items: cart.items,
      subtotal: cart.subtotal,
      total: cart.total,
      customer,
      paymentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.setOrder(orderId, order);
    return order;
  }

  get(orderId) {
    return store.getOrder(orderId) ?? null;
  }

  updateStatus(orderId, status, paymentId = null) {
    const order = store.getOrder(orderId);
    if (!order) throw httpError('Commande introuvable', 404);

    order.status = status;
    if (paymentId) order.paymentId = paymentId;
    order.updatedAt = new Date().toISOString();

    store.setOrder(orderId, order);
    return order;
  }
}

module.exports = new OrderService();
