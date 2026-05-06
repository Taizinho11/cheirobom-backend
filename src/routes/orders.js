const { Router } = require('express');
const cartService = require('../services/CartService');
const orderService = require('../services/OrderService');
const paymentService = require('../services/PaymentService');

const router = Router();

/**
 * POST /api/orders
 * Body: { sessionId, customer?: { name, email, phone } }
 *
 * Crée la commande, génère la session de paiement et renvoie l'URL de checkout.
 * Le panier est vidé après création.
 */
router.post('/', async (req, res, next) => {
  try {
    const { sessionId, customer = {} } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId requis' });

    const cart = cartService.get(sessionId);
    if (!cart) return res.status(404).json({ error: 'Panier introuvable' });
    if (!cart.items.length) return res.status(400).json({ error: 'Le panier est vide' });

    const order = orderService.createFromCart(cart, customer);
    const { paymentId, checkoutUrl } = await paymentService.createCheckout(order);

    cartService.clear(sessionId);

    res.status(201).json({ ...order, paymentId, checkoutUrl });
  } catch (err) {
    next(err);
  }
});

// Consulter une commande
router.get('/:orderId', (req, res) => {
  const order = orderService.get(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Commande introuvable' });
  res.json(order);
});

module.exports = router;
