const PaymentProvider = require('./PaymentProvider');

const SUMUP_API = 'https://api.sumup.com';

const STATUS_MAP = {
  PAID: 'paid',
  PENDING: 'pending',
  FAILED: 'failed',
  EXPIRED: 'expired',
};

// Provider SumUp conservé pour assurer la migration depuis le site existant.
class SumUpProvider extends PaymentProvider {
  constructor({ clientId, clientSecret, merchantCode, payBaseUrl }) {
    super();
    if (!clientId || !clientSecret || !merchantCode) {
      throw new Error('SUMUP_CLIENT_ID, SUMUP_CLIENT_SECRET et SUMUP_MERCHANT_CODE requis dans .env');
    }
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.merchantCode = merchantCode;
    this.payBaseUrl = payBaseUrl;
    this._token = null;
    this._tokenExpiry = 0;
  }

  async _getToken() {
    if (this._token && this._tokenExpiry > Date.now()) return this._token;

    const resp = await fetch(`${SUMUP_API}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`SumUp auth échouée (${resp.status}): ${text}`);
    }

    const data = await resp.json();
    this._token = data.access_token;
    // Renouvellement 60 s avant expiration
    this._tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this._token;
  }

  async createPayment({ orderId, amount, currency, description, redirectUrl }) {
    const token = await this._getToken();

    const resp = await fetch(`${SUMUP_API}/v0.1/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_reference: orderId,
        amount: amount / 100,
        currency,
        merchant_code: this.merchantCode,
        description,
        redirect_url: redirectUrl,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`SumUp création checkout échouée (${resp.status}): ${text}`);
    }

    const data = await resp.json();
    return {
      paymentId: data.id,
      checkoutUrl: `${this.payBaseUrl}?checkout_id=${data.id}`,
    };
  }

  async getPayment(paymentId) {
    const token = await this._getToken();

    const resp = await fetch(`${SUMUP_API}/v0.1/checkouts/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!resp.ok) throw new Error(`SumUp getPayment échoué (${resp.status})`);

    const data = await resp.json();
    return {
      paymentId: data.id,
      status: STATUS_MAP[data.status] ?? data.status.toLowerCase(),
      paid: data.status === 'PAID',
      amount: Math.round(data.amount * 100),
      currency: data.currency,
      metadata: { checkoutReference: data.checkout_reference },
    };
  }

  async handleWebhook(body) {
    const paymentId = body.id ?? body.checkout_id;
    if (!paymentId) throw new Error('Webhook SumUp : id manquant');
    return this.getPayment(paymentId);
  }
}

module.exports = SumUpProvider;
