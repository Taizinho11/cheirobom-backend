const config = require('../config');
const store = require('../store');
const orderService = require('./OrderService');
const MollieProvider = require('../providers/MollieProvider');
const SumUpProvider = require('../providers/SumUpProvider');
const PayPalProvider = require('../providers/PayPalProvider');
const TestProvider = require('../providers/TestProvider');

function buildProvider() {
  switch (config.payment.provider) {
    case 'mollie':
      return new MollieProvider(config.payment.mollie.apiKey);
    case 'sumup':
      return new SumUpProvider(config.payment.sumup);
    case 'paypal':
      return new PayPalProvider(config.payment.paypal);
    case 'test':
      return new TestProvider();
    default:
      throw new Error(`Fournisseur de paiement inconnu : "${config.payment.provider}"`);
  }
}

class PaymentService {
  constructor() {
    this.provider = buildProvider();
  }

  async createCheckout(order) {
    const { orderId, total, items } = order;

    const description = items.length === 1
      ? `${items[0].name} — commande ${orderId}`
      : `${items.length} articles — commande ${orderId}`;

    const { paymentId, checkoutUrl } = await this.provider.createPayment({
      orderId,
      amount: total,
      currency: 'EUR',
      description,
      redirectUrl: `${config.urls.backend}/api/payments/return?orderId=${orderId}`,
      webhookUrl: `${config.urls.backend}/api/payments/webhook`,
      metadata: { orderId },
    });

    store.linkPayment(paymentId, orderId);
    orderService.updateStatus(orderId, 'awaiting_payment', paymentId);

    return { paymentId, checkoutUrl };
  }

  async getStatus(paymentId) {
    return this.provider.getPayment(paymentId);
  }

  async handleWebhook(body, headers) {
    const result = await this.provider.handleWebhook(body, headers);
    const { paymentId, paid, status } = result;

    const orderId = store.getOrderIdByPayment(paymentId);
    if (orderId) {
      orderService.updateStatus(orderId, paid ? 'paid' : status);
    }

    return result;
  }
}

module.exports = new PaymentService();
