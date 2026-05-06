const { Router } = require('express');
const cartService = require('../services/CartService');

const router = Router();

// Créer un panier — renvoie le sessionId à stocker côté client
router.post('/', (req, res) => {
  const cart = cartService.create();
  res.status(201).json(cart);
});

// Récupérer le panier
router.get('/:sessionId', (req, res) => {
  const cart = cartService.get(req.params.sessionId);
  if (!cart) return res.status(404).json({ error: 'Panier introuvable' });
  res.json(cart);
});

// Ajouter un article
router.post('/:sessionId/items', (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId requis' });
    const cart = cartService.addItem(req.params.sessionId, productId, Number(quantity));
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// Modifier la quantité d'un article (quantity = 0 → suppression)
router.put('/:sessionId/items/:productId', (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (quantity === undefined) return res.status(400).json({ error: 'quantity requis' });
    const cart = cartService.updateItem(req.params.sessionId, req.params.productId, Number(quantity));
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// Supprimer un article
router.delete('/:sessionId/items/:productId', (req, res, next) => {
  try {
    const cart = cartService.removeItem(req.params.sessionId, req.params.productId);
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// Vider / supprimer le panier
router.delete('/:sessionId', (req, res) => {
  cartService.clear(req.params.sessionId);
  res.status(204).send();
});

module.exports = router;
