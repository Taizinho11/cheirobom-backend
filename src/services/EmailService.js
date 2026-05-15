const { Resend } = require('resend');

const ADMIN_EMAIL  = 'boutique.cheirobom@gmail.com';
const FROM_ADDRESS = 'onboarding@resend.dev';
const FROM_NAME    = 'Cheirobom';

// Prix stockés en centimes dans checkout.js → on divise par 100
function fmtPrice(centimes) {
  return (Number(centimes) / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
}

function fmtAddress(shipping = {}) {
  const parts = [
    shipping.address,
    [shipping.postal, shipping.city].filter(Boolean).join(' '),
    shipping.country,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

function buildClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

// ── Layout commun ────────────────────────────────────────────────────────────

function baseLayout(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Cheirobom</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;color:#2c2414;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0e8;padding:48px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:2px;overflow:hidden;box-shadow:0 4px 24px rgba(44,36,20,.10);">

        <!-- En-tête -->
        <tr>
          <td style="background:#0f0a04;padding:36px 40px;text-align:center;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:28px;letter-spacing:.18em;color:#c9a05a;text-transform:uppercase;">Cheirobom</div>
            <div style="margin-top:6px;font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:#6b5a3a;">Extraits de Parfum · Olfazeta 30%</div>
          </td>
        </tr>

        <!-- Bande décorative dorée -->
        <tr>
          <td style="background:linear-gradient(90deg,#8b6914,#c9a05a,#8b6914);height:2px;font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Corps -->
        <tr><td style="padding:40px 40px 32px;">${bodyHtml}</td></tr>

        <!-- Séparateur -->
        <tr>
          <td style="padding:0 40px;">
            <div style="border-top:1px solid #e8e0d0;"></div>
          </td>
        </tr>

        <!-- Pied de page -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;color:#9a8870;letter-spacing:.06em;">© Cheirobom · Extraits de Parfum Olfazeta</p>
            <p style="margin:0;font-size:10px;color:#b8a888;">boutique.cheirobom@gmail.com</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Tableau articles ─────────────────────────────────────────────────────────

function itemsTable(items = []) {
  const rows = items.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e8d8;font-size:13px;color:#2c2414;">${item.name}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e8d8;font-size:13px;color:#6b5a3a;text-align:center;">${item.quantity || item.qty || 1}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0e8d8;font-size:13px;color:#2c2414;text-align:right;white-space:nowrap;">${fmtPrice((item.price) * (item.quantity || item.qty || 1))}</td>
    </tr>`).join('');

  return `
  <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
    <thead>
      <tr style="background:#0f0a04;">
        <th style="padding:10px 12px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#c9a05a;font-weight:400;text-align:left;">Article</th>
        <th style="padding:10px 12px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#c9a05a;font-weight:400;text-align:center;">Qté</th>
        <th style="padding:10px 12px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#c9a05a;font-weight:400;text-align:right;">Prix</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ── Email 1 — Nouvelle commande → admin ──────────────────────────────────────

function newOrderAdminHtml(order) {
  const { orderId, customer = {}, shipping = {}, items = [], subtotal, total, createdAt } = order;
  const date = new Date(createdAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'full', timeStyle: 'short' });

  const body = `
    <!-- Badge statut -->
    <div style="background:#f5f0e8;border-left:3px solid #c9a05a;padding:14px 18px;margin-bottom:28px;border-radius:0 2px 2px 0;">
      <span style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#c9a05a;">Nouvelle commande reçue</span>
      <div style="margin-top:4px;font-family:Georgia,serif;font-size:22px;color:#0f0a04;letter-spacing:.06em;">${orderId}</div>
      <div style="margin-top:4px;font-size:12px;color:#9a8870;">${date}</div>
    </div>

    <!-- Infos client -->
    <h2 style="margin:0 0 14px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#c9a05a;font-weight:400;">Informations client</h2>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#faf7f2;border:1px solid #e8e0d0;">
      <tr>
        <td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#9a8870;width:38%;border-bottom:1px solid #e8e0d0;">Nom</td>
        <td style="padding:10px 14px;font-size:13px;color:#2c2414;border-bottom:1px solid #e8e0d0;">${customer.name || '—'}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#9a8870;border-bottom:1px solid #e8e0d0;">Email</td>
        <td style="padding:10px 14px;font-size:13px;color:#2c2414;border-bottom:1px solid #e8e0d0;">${customer.email || '—'}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#9a8870;border-bottom:1px solid #e8e0d0;">Téléphone</td>
        <td style="padding:10px 14px;font-size:13px;color:#2c2414;border-bottom:1px solid #e8e0d0;">${customer.phone || '—'}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#9a8870;">Adresse livraison</td>
        <td style="padding:10px 14px;font-size:13px;color:#2c2414;">${fmtAddress(shipping)}</td>
      </tr>
    </table>

    <!-- Articles -->
    <h2 style="margin:0 0 14px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#c9a05a;font-weight:400;">Articles commandés</h2>
    ${itemsTable(items)}

    <!-- Total -->
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:32px;">
      <tr>
        <td style="padding:8px 12px;font-size:12px;color:#9a8870;text-align:right;">Sous-total</td>
        <td style="padding:8px 12px;font-size:12px;color:#2c2414;text-align:right;white-space:nowrap;width:120px;">${fmtPrice(subtotal)}</td>
      </tr>
      <tr style="background:#f5f0e8;">
        <td style="padding:10px 12px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#2c2414;text-align:right;font-weight:600;">Total encaissé</td>
        <td style="padding:10px 12px;font-family:Georgia,serif;font-size:18px;color:#c9a05a;text-align:right;white-space:nowrap;">${fmtPrice(total)}</td>
      </tr>
    </table>

    <!-- Mention confidentielle -->
    <p style="margin:0;padding:12px 16px;background:#faf7f2;border:1px solid #e8e0d0;font-size:10px;color:#9a8870;text-align:center;letter-spacing:.06em;">
      🔒 Informations confidentielles — Usage interne uniquement
    </p>`;

  return baseLayout(body);
}

// ── Email 2 — Confirmation → client ─────────────────────────────────────────

function confirmationClientHtml(order) {
  const { orderId, customer = {}, items = [], subtotal, total } = order;
  const firstName = (customer.name || 'cher(e) client(e)').split(' ')[0];

  const body = `
    <!-- Message de bienvenue -->
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;font-weight:400;color:#0f0a04;letter-spacing:.04em;">Merci, ${firstName} !</h1>
    <p style="margin:0 0 28px;font-size:14px;line-height:1.8;color:#6b5a3a;">
      Votre commande a bien été reçue et est en cours de traitement.<br>
      Nous mettons tout notre soin à préparer votre extrait de parfum avec la plus grande attention.
    </p>

    <!-- Numéro de commande -->
    <div style="background:#f5f0e8;border:1px solid #e8e0d0;padding:18px 22px;margin-bottom:28px;text-align:center;">
      <div style="font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#9a8870;margin-bottom:6px;">Votre numéro de commande</div>
      <div style="font-family:Georgia,serif;font-size:24px;color:#0f0a04;letter-spacing:.1em;">${orderId}</div>
      <div style="margin-top:6px;font-size:11px;color:#9a8870;">Conservez ce numéro pour tout suivi</div>
    </div>

    <!-- Récapitulatif -->
    <h2 style="margin:0 0 14px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#c9a05a;font-weight:400;">Récapitulatif de votre commande</h2>
    ${itemsTable(items)}

    <!-- Total -->
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:32px;">
      <tr>
        <td style="padding:8px 12px;font-size:12px;color:#9a8870;text-align:right;">Sous-total</td>
        <td style="padding:8px 12px;font-size:12px;color:#2c2414;text-align:right;white-space:nowrap;width:120px;">${fmtPrice(subtotal)}</td>
      </tr>
      <tr style="background:#f5f0e8;">
        <td style="padding:10px 12px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#2c2414;text-align:right;font-weight:600;">Total</td>
        <td style="padding:10px 12px;font-family:Georgia,serif;font-size:18px;color:#c9a05a;text-align:right;white-space:nowrap;">${fmtPrice(total)}</td>
      </tr>
    </table>

    <!-- Délai de livraison -->
    <div style="background:#0f0a04;padding:20px 24px;margin-bottom:28px;text-align:center;">
      <div style="font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#c9a05a;margin-bottom:8px;">Délai de livraison estimé</div>
      <div style="font-family:Georgia,serif;font-size:18px;color:#ffffff;">5 à 10 jours ouvrés</div>
      <div style="margin-top:6px;font-size:11px;color:#9a8870;">selon votre localisation</div>
    </div>

    <!-- Contact -->
    <p style="margin:0 0 20px;font-size:13px;line-height:1.8;color:#6b5a3a;">
      Une question sur votre commande ? Notre équipe est disponible à<br>
      <a href="mailto:boutique.cheirobom@gmail.com" style="color:#c9a05a;text-decoration:none;font-weight:600;">boutique.cheirobom@gmail.com</a>
    </p>

    <!-- Mention RGPD -->
    <p style="margin:0;padding:12px 16px;background:#faf7f2;border:1px solid #e8e0d0;font-size:10px;color:#9a8870;text-align:center;letter-spacing:.04em;line-height:1.6;">
      🔒 Vos données personnelles sont protégées et ne seront jamais partagées avec des tiers,
      conformément au Règlement Général sur la Protection des Données (RGPD).
    </p>`;

  return baseLayout(body);
}

// ── Email 3 — Paiement confirmé → admin ─────────────────────────────────────

function paymentConfirmedAdminHtml(order) {
  const { orderId, customer = {}, shipping = {}, total, paymentId } = order;
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'full', timeStyle: 'short' });

  const body = `
    <!-- Badge -->
    <div style="background:#0a1f0a;border-left:3px solid #4caf50;padding:14px 18px;margin-bottom:28px;border-radius:0 2px 2px 0;">
      <span style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#4caf50;">✓ Paiement confirmé</span>
      <div style="margin-top:4px;font-family:Georgia,serif;font-size:22px;color:#ffffff;letter-spacing:.06em;">${orderId}</div>
      <div style="margin-top:4px;font-size:12px;color:#9a9a9a;">${now}</div>
    </div>

    <!-- Infos -->
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#faf7f2;border:1px solid #e8e0d0;">
      <tr>
        <td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#9a8870;width:38%;border-bottom:1px solid #e8e0d0;">Client</td>
        <td style="padding:10px 14px;font-size:13px;color:#2c2414;border-bottom:1px solid #e8e0d0;">${customer.name || '—'}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#9a8870;border-bottom:1px solid #e8e0d0;">Email</td>
        <td style="padding:10px 14px;font-size:13px;color:#2c2414;border-bottom:1px solid #e8e0d0;">${customer.email || '—'}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#9a8870;border-bottom:1px solid #e8e0d0;">Adresse livraison</td>
        <td style="padding:10px 14px;font-size:13px;color:#2c2414;border-bottom:1px solid #e8e0d0;">${fmtAddress(shipping)}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#9a8870;border-bottom:1px solid #e8e0d0;">ID Paiement</td>
        <td style="padding:10px 14px;font-size:13px;color:#2c2414;border-bottom:1px solid #e8e0d0;">${paymentId || '—'}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#9a8870;">Montant encaissé</td>
        <td style="padding:10px 14px;font-family:Georgia,serif;font-size:20px;color:#c9a05a;">${fmtPrice(total)}</td>
      </tr>
    </table>

    <p style="margin:0;padding:12px 16px;background:#faf7f2;border:1px solid #e8e0d0;font-size:10px;color:#9a8870;text-align:center;letter-spacing:.06em;">
      🔒 Informations confidentielles — Usage interne uniquement
    </p>`;

  return baseLayout(body);
}

// ── EmailService ─────────────────────────────────────────────────────────────

class EmailService {
  constructor() {
    this._client = null;
  }

  _getClient() {
    if (!this._client) {
      this._client = buildClient();
    }
    return this._client;
  }

  async _send({ to, subject, html }) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[EmailService] RESEND_API_KEY manquant — email ignoré');
      return;
    }
    try {
      const { data, error } = await this._getClient().emails.send({
        from: `${FROM_NAME} <${FROM_ADDRESS}>`,
        to,
        subject,
        html,
      });
      if (error) throw new Error(JSON.stringify(error));
      console.log(`[EmailService] Envoyé : "${subject}" → ${to} (id: ${data?.id})`);
    } catch (err) {
      console.error(`[EmailService] Échec : "${subject}" → ${to} :`, err.message);
      throw err;
    }
  }

  // Appelé à la création d'une commande (checkout.js et OrderService)
  async onOrderCreated(order) {
    console.log(`[EmailService] onOrderCreated — ${order.orderId}`);
    const { customer = {} } = order;

    await Promise.all([
      this._send({
        to: ADMIN_EMAIL,
        subject: `🛍️ Nouvelle commande Cheirobom — ${order.orderId}`,
        html: newOrderAdminHtml(order),
      }),

      customer.email
        ? this._send({
            to: customer.email,
            subject: `Merci pour votre commande — Cheirobom 🖤`,
            html: confirmationClientHtml(order),
          })
        : Promise.resolve(),
    ]);
  }

  // Appelé quand le paiement est confirmé (statut 'paid')
  async onPaymentConfirmed(order) {
    console.log(`[EmailService] onPaymentConfirmed — ${order.orderId}`);
    await this._send({
      to: ADMIN_EMAIL,
      subject: `✅ Paiement reçu — ${order.orderId}`,
      html: paymentConfirmedAdminHtml(order),
    });
  }
}

module.exports = new EmailService();
