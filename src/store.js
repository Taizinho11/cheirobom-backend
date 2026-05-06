// Stockage en mémoire — remplacer par Redis (carts) + PostgreSQL (orders) en production.

class Store {
  constructor() {
    this._carts = new Map();
    this._orders = new Map();
    this._paymentToOrder = new Map(); // paymentId → orderId
  }

  // ── Panier ─────────────────────────────────────────────

  getCart(sessionId) {
    return this._carts.get(sessionId) ?? null;
  }

  setCart(sessionId, cart) {
    this._carts.set(sessionId, cart);
  }

  deleteCart(sessionId) {
    this._carts.delete(sessionId);
  }

  // ── Commandes ─────────────────────────────────────────

  getOrder(orderId) {
    return this._orders.get(orderId) ?? null;
  }

  setOrder(orderId, order) {
    this._orders.set(orderId, order);
  }

  // ── Liaison paiement ↔ commande ───────────────────────

  linkPayment(paymentId, orderId) {
    this._paymentToOrder.set(paymentId, orderId);
  }

  getOrderIdByPayment(paymentId) {
    return this._paymentToOrder.get(paymentId) ?? null;
  }
}

module.exports = new Store();
