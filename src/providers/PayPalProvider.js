const PaymentProvider = require('./PaymentProvider');

const STATUS_MAP = {
  CREATED: 'pending',
  SAVED: 'pending',
  APPROVED: 'pending',
  VOIDED: 'cancelled',
  COMPLETED: 'paid',
  PAYER_ACTION_REQUIRED: 'pending',
};

class PayPalProvider extends PaymentProvider {
  constructor({ clientId, clientSecret, sandbox }) {
    super();
    if (!clientId || !clientSecret) {
      throw new Error('PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET requis dans .env');
    }
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.apiBase = sandbox !== false
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';
    this._token = null;
    this._tokenExpiry = 0;
  }

  async _getToken() {
    if (this._token && this._tokenExpiry > Date.now()) return this._token;

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const resp = await fetch(`${this.apiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`PayPal auth échouée (${resp.status}): ${text}`);
    }

    const data = await resp.json();
    this._token = data.access_token;
    this._tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this._token;
  }

  async createPayment({ orderId, amount, currency, description, redirectUrl }) {
    const token = await this._getToken();

    const resp = await fetch(`${this.apiBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': orderId,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderId,
          description,
          amount: {
            currency_code: currency,
            value: (amount / 100).toFixed(2),
          },
        }],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: redirectUrl,
              cancel_url: `${redirectUrl}&payment=cancelled`,
            },
          },
        },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`PayPal création order échouée (${resp.status}): ${text}`);
    }

    const data = await resp.json();
    const approveLink = data.links.find(l => l.rel === 'payer-action');
    if (!approveLink) throw new Error('PayPal : lien payer-action introuvable dans la réponse');

    return { paymentId: data.id, checkoutUrl: approveLink.href };
  }

  async getPayment(paymentId) {
    const token = await this._getToken();

    const resp = await fetch(`${this.apiBase}/v2/checkout/orders/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) throw new Error(`PayPal getPayment échoué (${resp.status})`);

    const data = await resp.json();

    // L'acheteur a approuvé mais le paiement n'est pas encore capturé — on capture ici.
    if (data.status === 'APPROVED') {
      return this._capture(paymentId, token);
    }

    return this._normalize(data);
  }

  async _capture(paymentId, token) {
    const resp = await fetch(`${this.apiBase}/v2/checkout/orders/${paymentId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`PayPal capture échouée (${resp.status}): ${text}`);
    }

    return this._normalize(await resp.json());
  }

  _normalize(data) {
    const status = STATUS_MAP[data.status] ?? data.status.toLowerCase();
    const unit = data.purchase_units?.[0];
    const capture = unit?.payments?.captures?.[0];
    const amountValue = capture?.amount?.value ?? unit?.amount?.value ?? '0';
    const currency = capture?.amount?.currency_code ?? unit?.amount?.currency_code ?? 'EUR';

    return {
      paymentId: data.id,
      status,
      paid: data.status === 'COMPLETED',
      amount: Math.round(parseFloat(amountValue) * 100),
      currency,
      metadata: { referenceId: unit?.reference_id },
    };
  }

  async handleWebhook(body) {
    // Pour PAYMENT.CAPTURE.*, resource.id est un capture ID — on remonte à l'order ID.
    const paymentId = body.resource?.supplementary_data?.related_ids?.order_id
      ?? body.resource?.id;
    if (!paymentId) throw new Error('Webhook PayPal : resource.id manquant');
    return this.getPayment(paymentId);
  }
}

module.exports = PayPalProvider;
