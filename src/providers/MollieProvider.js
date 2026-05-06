const { createMollieClient } = require('@mollie/api-client');
const PaymentProvider = require('./PaymentProvider');

// Mapping statuts Mollie → statuts normalisés
const STATUS_MAP = {
  open: 'pending',
  pending: 'pending',
  authorized: 'pending',
  paid: 'paid',
  failed: 'failed',
  canceled: 'cancelled',
  expired: 'expired',
};

class MollieProvider extends PaymentProvider {
  constructor(apiKey) {
    super();
    if (!apiKey) throw new Error('MOLLIE_API_KEY manquant dans .env');
    this.client = createMollieClient({ apiKey });
  }

  async createPayment({ orderId, amount, currency, description, redirectUrl, webhookUrl, metadata }) {
    const payment = await this.client.payments.create({
      amount: {
        value: (amount / 100).toFixed(2),
        currency,
      },
      description,
      redirectUrl,
      webhookUrl,
      metadata: { orderId, ...metadata },
    });

    return {
      paymentId: payment.id,
      checkoutUrl: payment.getCheckoutUrl(),
    };
  }

  async getPayment(paymentId) {
    const p = await this.client.payments.get(paymentId);
    return {
      paymentId: p.id,
      status: STATUS_MAP[p.status] ?? p.status,
      paid: p.isPaid(),
      amount: Math.round(parseFloat(p.amount.value) * 100),
      currency: p.amount.currency,
      metadata: p.metadata ?? {},
    };
  }

  // Mollie envoie juste l'id via x-www-form-urlencoded.
  // On vérifie le vrai statut côté API plutôt que de faire confiance au webhook.
  async handleWebhook(body) {
    const paymentId = body.id;
    if (!paymentId) throw new Error('Webhook Mollie : id manquant');
    return this.getPayment(paymentId);
  }
}

module.exports = MollieProvider;
