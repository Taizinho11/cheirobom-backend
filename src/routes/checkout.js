const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../store');
const orderService = require('../services/OrderService');
const paymentService = require('../services/PaymentService');
const emailService = require('../services/EmailService');

const router = Router();

/**
 * POST /api/checkout
 * Body: { items: [{ name, size?, price, qty }], customer: { name, email } }
 * Crée une commande directement depuis le panier frontend et renvoie l'URL Mollie.
 */
router.post('/', async (req, res, next) => {
  try {
    const { items, customer = {}, shipping = {} } = req.body;

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'items requis' });
    }

    for (const item of items) {
      if (!item.name || typeof item.price !== 'number' || item.price <= 0 || !item.qty || item.qty < 1) {
        return res.status(400).json({ error: 'Chaque article doit avoir name, price (en euros) et qty' });
      }
    }

    const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;

    const orderItems = items.map(item => ({
      name: item.size ? `${item.name} · ${item.size}` : item.name,
      price: Math.round(item.price * 100),
      currency: 'EUR',
      quantity: item.qty,
    }));

    const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = {
      orderId,
      status: 'pending',
      items: orderItems,
      subtotal: total,
      total,
      customer,
      shipping,
      paymentId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.setOrder(orderId, order);
    emailService.onOrderCreated(order).catch(err => console.error('Email error:', err));

    const { checkoutUrl } = await paymentService.createCheckout(order);

    res.status(201).json({ checkoutUrl, orderId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
