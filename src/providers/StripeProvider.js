const Stripe = require('stripe');
const PaymentProvider = require('./PaymentProvider');

const STATUS_MAP = {
  open: 'pending',
  complete: 'paid',
  expired: 'expired',
};

class StripeProvider extends PaymentProvider {
  constructor({ secretKey }) {
    super();
    if (!secretKey) throw new Error('STRIPE_SECRET_KEY requis dans .env');
    this.stripe = new Stripe(secretKey);
  }

  async createPayment({ orderId, amount, currency, description, redirectUrl }) {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: description },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      success_url: `${redirectUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${redirectUrl}&payment=cancelled`,
      client_reference_id: orderId,
      metadata: { orderId },
    });

    return { paymentId: session.id, checkoutUrl: session.url };
  }

  async getPayment(paymentId) {
    const session = await this.stripe.checkout.sessions.retrieve(paymentId);
    return {
      paymentId: session.id,
      status: STATUS_MAP[session.status] ?? session.status,
      paid: session.status === 'complete' && session.payment_status === 'paid',
      amount: session.amount_total ?? 0,
      currency: (session.currency ?? 'eur').toUpperCase(),
      metadata: session.metadata ?? {},
    };
  }

  // Stripe envoie checkout.session.completed — on re-vérifie via l'API plutôt que de faire confiance au payload.
  async handleWebhook(body) {
    const sessionId = body?.data?.object?.id;
    if (!sessionId) throw new Error('Webhook Stripe : data.object.id manquant');
    return this.getPayment(sessionId);
  }
}

module.exports = StripeProvider;
