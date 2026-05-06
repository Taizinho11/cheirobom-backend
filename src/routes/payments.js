const { Router } = require('express');
const config = require('../config');
const orderService = require('../services/OrderService');
const paymentService = require('../services/PaymentService');

const router = Router();

/**
 * GET /api/payments/return?orderId=ORD-XXXX
 * URL de redirection après paiement (appelée par Mollie / SumUp).
 * Redirige vers le frontend avec le résultat.
 */
router.get('/return', async (req, res) => {
  const { orderId } = req.query;
  const order = orderId ? orderService.get(orderId) : null;

  if (!order) {
    return res.redirect(`${config.urls.frontend}?payment=error`);
  }

  // Vérifier le statut réel auprès du provider
  if (order.paymentId) {
    try {
      const status = await paymentService.getStatus(order.paymentId);
      if (status.paid) {
        orderService.updateStatus(orderId, 'paid');
        return res.redirect(`${config.urls.frontend}?payment=success&orderId=${orderId}`);
      }
      if (status.status === 'failed' || status.status === 'cancelled') {
        orderService.updateStatus(orderId, status.status);
        return res.redirect(`${config.urls.frontend}?payment=${status.status}&orderId=${orderId}`);
      }
    } catch (err) {
      console.error('Vérification du statut paiement échouée :', err.message);
    }
  }

  // Statut déjà enregistré (ex : webhook reçu avant la redirection)
  const param = order.status === 'paid' ? 'success' : 'pending';
  return res.redirect(`${config.urls.frontend}?payment=${param}&orderId=${orderId}`);
});

/**
 * POST /api/payments/webhook
 * Notification asynchrone du provider.
 * Toujours répondre 200 pour éviter les boucles de retry.
 */
router.post('/webhook', async (req, res) => {
  try {
    await paymentService.handleWebhook(req.body, req.headers);
  } catch (err) {
    console.error('Erreur webhook :', err.message);
  }
  res.status(200).send('OK');
});

/**
 * GET /api/payments/test-pay?paymentId=&orderId=&amount=&currency=
 * Page de simulation de paiement (PAYMENT_PROVIDER=test uniquement).
 * Affiche un récapitulatif de commande et deux boutons : confirmer / annuler.
 */
router.get('/test-pay', (req, res) => {
  const { paymentId, orderId, amount, currency = 'EUR' } = req.query;
  if (!paymentId || !orderId) return res.status(400).send('Paramètres manquants');

  const order = orderService.get(orderId);
  const amountStr = order
    ? (order.total / 100).toFixed(2).replace('.', ',') + ' €'
    : ((parseFloat(amount) || 0) / 100).toFixed(2).replace('.', ',') + ' €';

  const items = order
    ? order.items.map(i => `<li>${i.name} × ${i.quantity} — ${(i.price * i.quantity / 100).toFixed(2).replace('.', ',')} €</li>`).join('')
    : '';

  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Paiement de test — CHEIROBOM</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#f5f0e8;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px}
    .box{background:#fff;border-radius:16px;padding:32px;max-width:420px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.1)}
    .badge{display:inline-block;background:#fff3cd;color:#856404;font-size:11px;padding:4px 12px;border-radius:20px;letter-spacing:1px;margin-bottom:20px;font-weight:600}
    h2{font-size:20px;color:#3d2b1f;margin-bottom:4px}
    .ref{font-size:12px;color:#999;margin-bottom:20px}
    ul{list-style:none;padding:0;margin-bottom:16px;border-top:1px solid #f0e8e0;border-bottom:1px solid #f0e8e0;padding:12px 0}
    li{font-size:13px;color:#5c3d2e;padding:3px 0}
    .total{font-size:18px;font-weight:700;color:#3d2b1f;text-align:right;margin-bottom:28px}
    .btns{display:flex;flex-direction:column;gap:10px}
    .btn-ok{background:#3a5c3a;color:#fff;border:none;padding:14px;border-radius:30px;font-size:14px;cursor:pointer;font-weight:600;transition:background 0.2s}
    .btn-ok:hover{background:#2e4a2e}
    .btn-cancel{background:none;border:1.5px solid #ddd;color:#999;padding:12px;border-radius:30px;font-size:13px;cursor:pointer;transition:border-color 0.2s}
    .btn-cancel:hover{border-color:#c1622a;color:#c1622a}
  </style>
</head>
<body>
  <div class="box">
    <div class="badge">⚠️ MODE TEST — aucun vrai paiement</div>
    <h2>Simuler un paiement</h2>
    <div class="ref">Commande ${orderId}</div>
    <ul>${items}</ul>
    <div class="total">Total : ${amountStr}</div>
    <div class="btns">
      <button class="btn-ok" onclick="window.location.href='/api/payments/test-confirm?paymentId=${paymentId}&orderId=${orderId}'">
        ✅ Confirmer le paiement
      </button>
      <button class="btn-cancel" onclick="window.location.href='/api/payments/test-cancel?orderId=${orderId}'">
        Annuler
      </button>
    </div>
  </div>
</body>
</html>`);
});

/**
 * GET /api/payments/test-confirm?paymentId=&orderId=
 * Marque la commande comme payée et redirige vers le frontend.
 */
router.get('/test-confirm', (req, res) => {
  const { paymentId, orderId } = req.query;
  if (!orderId) return res.status(400).send('orderId manquant');

  try { orderService.updateStatus(orderId, 'paid'); } catch (e) {}
  return res.redirect(`${config.urls.frontend}?payment=success&orderId=${orderId}`);
});

/**
 * GET /api/payments/test-cancel?orderId=
 * Marque la commande comme annulée et redirige vers le frontend.
 */
router.get('/test-cancel', (req, res) => {
  const { orderId } = req.query;
  if (orderId) { try { orderService.updateStatus(orderId, 'cancelled'); } catch (e) {} }
  return res.redirect(`${config.urls.frontend}?payment=cancelled`);
});

/**
 * GET /api/payments/:paymentId/status
 * Permet au frontend de vérifier manuellement l'état d'un paiement.
 */
router.get('/:paymentId/status', async (req, res, next) => {
  try {
    const status = await paymentService.getStatus(req.params.paymentId);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
