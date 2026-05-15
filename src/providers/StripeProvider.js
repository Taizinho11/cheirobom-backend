// src/fournisseurs/StripeProvider.js

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
    if (!secretKey) console.warn('STRIPE_SECRET_KEY absent — les paiements Stripe échoueront');
    this.stripe = secretKey ? new Stripe(secretKey) : null;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || null;
    if (!this.webhookSecret) console.warn('STRIPE_WEBHOOK_SECRET absent — la signature des webhooks ne sera pas vérifiée');
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

      // ✅ AJOUT 1 — Demande l'adresse de livraison au client
      shipping_address_collection: {
        allowed_countries: ['FR', 'IT', 'BE', 'CH', 'LU', 'MC', 'PT', 'ES'],
      },

      // ✅ AJOUT 2 — Propose Livraison ou Click & Collect
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 500, currency: currency.toLowerCase() },
            display_name: '🚚 Livraison à domicile',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 3 },
              maximum: { unit: 'business_day', value: 5 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: currency.toLowerCase() },
            display_name: '🏪 Click & Collect – Vallauris',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 1 },
              maximum: { unit: 'business_day', value: 2 },
            },
          },
        },
      ],

      // ✅ AJOUT 3 — Demande le numéro de téléphone
      phone_number_collection: { enabled: true },
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
      // ✅ Adresse et livraison récupérables ici
      shipping: session.shipping_details ?? null,
      shippingCost: session.shipping_cost ?? null,
    };
  }

  async handleWebhook(body, headers) {
    // Valider la signature Stripe si STRIPE_WEBHOOK_SECRET est défini
    if (this.webhookSecret) {
      const sig = headers?.['stripe-signature'];
      if (!sig) throw new Error('Webhook Stripe : en-tête stripe-signature manquant');
      // body doit être le raw Buffer (pas le JSON parsé) pour que la vérification fonctionne
      try {
        this.stripe.webhooks.constructEvent(body, sig, this.webhookSecret);
      } catch (err) {
        throw new Error(`Webhook Stripe : signature invalide — ${err.message}`);
      }
    }

    const parsed = typeof body === 'string' || Buffer.isBuffer(body) ? JSON.parse(body) : body;
    const sessionId = parsed?.data?.object?.id;
    if (!sessionId) throw new Error('Webhook Stripe : data.object.id manquant');
    return this.getPayment(sessionId);
  }
}

module.exports = StripeProvider;
