const { v4: uuidv4 } = require('uuid');
const store = require('../store');
const { getProduct } = require('../catalog');

function httpError(msg, status) {
  return Object.assign(new Error(msg), { status });
}

class CartService {
  create() {
    const sessionId = uuidv4();
    const cart = { sessionId, items: [], createdAt: new Date().toISOString() };
    store.setCart(sessionId, cart);
    return this._withTotals(cart);
  }

  get(sessionId) {
    const cart = store.getCart(sessionId);
    return cart ? this._withTotals(cart) : null;
  }

  addItem(sessionId, productId, quantity = 1) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw httpError('La quantité doit être un entier positif', 400);
    }

    const product = getProduct(productId);
    if (!product) throw httpError('Produit introuvable', 404);

    let cart = store.getCart(sessionId);
    if (!cart) {
      cart = { sessionId, items: [], createdAt: new Date().toISOString() };
    }

    const existing = cart.items.find(i => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({
        productId,
        name: product.name,
        price: product.price,
        currency: product.currency,
        quantity,
      });
    }

    store.setCart(sessionId, cart);
    return this._withTotals(cart);
  }

  updateItem(sessionId, productId, quantity) {
    const cart = store.getCart(sessionId);
    if (!cart) throw httpError('Panier introuvable', 404);

    const item = cart.items.find(i => i.productId === productId);
    if (!item) throw httpError('Article introuvable dans le panier', 404);

    if (quantity <= 0) {
      cart.items = cart.items.filter(i => i.productId !== productId);
    } else {
      item.quantity = quantity;
    }

    store.setCart(sessionId, cart);
    return this._withTotals(cart);
  }

  removeItem(sessionId, productId) {
    const cart = store.getCart(sessionId);
    if (!cart) throw httpError('Panier introuvable', 404);

    cart.items = cart.items.filter(i => i.productId !== productId);
    store.setCart(sessionId, cart);
    return this._withTotals(cart);
  }

  clear(sessionId) {
    store.deleteCart(sessionId);
  }

  _withTotals(cart) {
    const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);
    return { ...cart, subtotal, total: subtotal, itemCount };
  }
}

module.exports = new CartService();
