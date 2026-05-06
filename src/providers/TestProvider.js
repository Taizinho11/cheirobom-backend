const { v4: uuidv4 } = require('uuid');
const PaymentProvider = require('./PaymentProvider');

// Provider de test — ne traite aucun vrai paiement.
// Utilisé en développement pour valider le flux complet sans clé Mollie.
// Remplacer PAYMENT_PROVIDER=test par PAYMENT_PROVIDER=mollie en production.
class TestProvider extends PaymentProvider {
  async createPayment({ orderId, amount, currency, description }) {
    const paymentId = `test_${uuidv4().slice(0, 12)}`;
    const backendUrl = require('../config').urls.backend;
    const checkoutUrl = `${backendUrl}/api/payments/test-pay`
      + `?paymentId=${paymentId}&orderId=${orderId}`
      + `&amount=${amount}&currency=${currency}`;
    return { paymentId, checkoutUrl };
  }

  async getPayment(paymentId) {
    return {
      paymentId,
      status:   'paid',
      paid:     true,
      amount:   0,
      currency: 'EUR',
      metadata: {},
    };
  }

  async handleWebhook(body) {
    return { paymentId: body.id || 'test', status: 'paid', paid: true };
  }
}

module.exports = TestProvider;
