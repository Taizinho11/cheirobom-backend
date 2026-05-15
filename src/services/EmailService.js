const nodemailer = require('nodemailer');

const ADMIN_EMAIL = 'italosoaresleal11@gmail.com';

function buildTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

function formatItems(items) {
  return items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ebe3;">${item.name}${item.size ? ` — ${item.size}` : ''}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ebe3;text-align:center;">${item.qty}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f0ebe3;text-align:right;">${(item.price * item.qty).toFixed(2)} €</td>
        </tr>`
    )
    .join('');
}

function baseLayout(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf8f5;font-family:'Helvetica Neue',Arial,sans-serif;color:#3d3020;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,.06);">
        <!-- Header -->
        <tr>
          <td style="background:#1a1209;padding:28px 40px;text-align:center;">
            <span style="font-family:Georgia,serif;font-size:24px;color:#b8924a;letter-spacing:.12em;">CHEIROBOM</span>
            <p style="margin:6px 0 0;font-size:11px;color:#7a6a4a;letter-spacing:.2em;text-transform:uppercase;">Extraits de Parfum Olfazeta</p>
          </td>
        </tr>
        <!-- Title -->
        <tr>
          <td style="padding:32px 40px 0;border-bottom:2px solid #b8924a;">
            <h1 style="margin:0 0 24px;font-size:20px;font-weight:400;color:#1a1209;">${title}</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:28px 40px;">${bodyHtml}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#faf8f5;border-top:1px solid #f0ebe3;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9a8a6a;">© Cheirobom · Extraits de Parfum Olfazeta 30%</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Email 1 : Nouvelle commande → admin ──────────────────────────────────────

function newOrderAdminHtml(order) {
  const { orderId, customer = {}, items = [], subtotal, total, createdAt } = order;
  const date = new Date(createdAt).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

  const body = `
    <p style="margin:0 0 16px;">Une nouvelle commande vient d'être créée.</p>

    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <td style="padding:8px 12px;background:#faf8f5;font-size:13px;color:#7a6a4a;">Commande</td>
        <td style="padding:8px 12px;font-size:13px;font-weight:600;">${orderId}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#faf8f5;font-size:13px;color:#7a6a4a;">Date</td>
        <td style="padding:8px 12px;font-size:13px;">${date}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#faf8f5;font-size:13px;color:#7a6a4a;">Client</td>
        <td style="padding:8px 12px;font-size:13px;">${customer.name || '—'}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#faf8f5;font-size:13px;color:#7a6a4a;">Email client</td>
        <td style="padding:8px 12px;font-size:13px;">${customer.email || '—'}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#faf8f5;font-size:13px;color:#7a6a4a;">Téléphone</td>
        <td style="padding:8px 12px;font-size:13px;">${customer.phone || '—'}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#faf8f5;font-size:13px;color:#7a6a4a;">Adresse</td>
        <td style="padding:8px 12px;font-size:13px;">${customer.address || '—'}</td>
      </tr>
    </table>

    <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1a1209;text-transform:uppercase;letter-spacing:.08em;">Articles commandés</h3>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr style="background:#1a1209;">
          <th style="padding:8px 12px;font-size:12px;color:#b8924a;text-align:left;font-weight:400;letter-spacing:.08em;">Article</th>
          <th style="padding:8px 12px;font-size:12px;color:#b8924a;text-align:center;font-weight:400;letter-spacing:.08em;">Qté</th>
          <th style="padding:8px 12px;font-size:12px;color:#b8924a;text-align:right;font-weight:400;letter-spacing:.08em;">Prix</th>
        </tr>
      </thead>
      <tbody>${formatItems(items)}</tbody>
    </table>

    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="padding:6px 12px;font-size:13px;color:#7a6a4a;">Sous-total</td>
        <td style="padding:6px 12px;font-size:13px;text-align:right;">${Number(subtotal).toFixed(2)} €</td>
      </tr>
      <tr>
        <td style="padding:6px 12px;font-size:14px;font-weight:700;color:#1a1209;">Total</td>
        <td style="padding:6px 12px;font-size:14px;font-weight:700;color:#b8924a;text-align:right;">${Number(total).toFixed(2)} €</td>
      </tr>
    </table>
  `;

  return baseLayout(`Nouvelle commande — ${orderId}`, body);
}

// ── Email 2 : Confirmation → client ─────────────────────────────────────────

function confirmationClientHtml(order) {
  const { orderId, customer = {}, items = [], subtotal, total } = order;
  const firstName = (customer.name || 'Client').split(' ')[0];

  const body = `
    <p style="margin:0 0 16px;">Bonjour <strong>${firstName}</strong>,</p>
    <p style="margin:0 0 24px;line-height:1.7;">
      Merci pour votre commande ! Nous avons bien reçu votre demande et vous confirmons
      sa prise en charge. Vous recevrez un email dès que votre paiement sera validé.
    </p>

    <div style="background:#faf8f5;border-left:3px solid #b8924a;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#7a6a4a;letter-spacing:.06em;text-transform:uppercase;">Numéro de commande</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:700;color:#1a1209;letter-spacing:.06em;">${orderId}</p>
    </div>

    <h3 style="margin:0 0 12px;font-size:14px;font-weight:600;color:#1a1209;text-transform:uppercase;letter-spacing:.08em;">Récapitulatif</h3>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr style="background:#1a1209;">
          <th style="padding:8px 12px;font-size:12px;color:#b8924a;text-align:left;font-weight:400;letter-spacing:.08em;">Article</th>
          <th style="padding:8px 12px;font-size:12px;color:#b8924a;text-align:center;font-weight:400;letter-spacing:.08em;">Qté</th>
          <th style="padding:8px 12px;font-size:12px;color:#b8924a;text-align:right;font-weight:400;letter-spacing:.08em;">Prix</th>
        </tr>
      </thead>
      <tbody>${formatItems(items)}</tbody>
    </table>

    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:28px;">
      <tr>
        <td style="padding:6px 12px;font-size:13px;color:#7a6a4a;">Sous-total</td>
        <td style="padding:6px 12px;font-size:13px;text-align:right;">${Number(subtotal).toFixed(2)} €</td>
      </tr>
      <tr>
        <td style="padding:6px 12px;font-size:14px;font-weight:700;color:#1a1209;">Total</td>
        <td style="padding:6px 12px;font-size:14px;font-weight:700;color:#b8924a;text-align:right;">${Number(total).toFixed(2)} €</td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;line-height:1.7;color:#7a6a4a;">
      Pour toute question, répondez à cet email ou contactez-nous directement.<br>
      <strong style="color:#1a1209;">L'équipe Cheirobom</strong>
    </p>
  `;

  return baseLayout('Confirmation de commande', body);
}

// ── Email 3 : Paiement confirmé → admin ─────────────────────────────────────

function paymentConfirmedAdminHtml(order) {
  const { orderId, customer = {}, total, paymentId } = order;
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

  const body = `
    <p style="margin:0 0 16px;">
      Le paiement de la commande <strong>${orderId}</strong> a été confirmé.
    </p>

    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <td style="padding:8px 12px;background:#faf8f5;font-size:13px;color:#7a6a4a;">Commande</td>
        <td style="padding:8px 12px;font-size:13px;font-weight:600;">${orderId}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#faf8f5;font-size:13px;color:#7a6a4a;">ID Paiement</td>
        <td style="padding:8px 12px;font-size:13px;">${paymentId || '—'}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#faf8f5;font-size:13px;color:#7a6a4a;">Client</td>
        <td style="padding:8px 12px;font-size:13px;">${customer.name || '—'}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#faf8f5;font-size:13px;color:#7a6a4a;">Email client</td>
        <td style="padding:8px 12px;font-size:13px;">${customer.email || '—'}</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#faf8f5;font-size:13px;color:#7a6a4a;">Montant encaissé</td>
        <td style="padding:8px 12px;font-size:15px;font-weight:700;color:#b8924a;">${Number(total).toFixed(2)} €</td>
      </tr>
      <tr>
        <td style="padding:8px 12px;background:#faf8f5;font-size:13px;color:#7a6a4a;">Confirmé le</td>
        <td style="padding:8px 12px;font-size:13px;">${now}</td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#7a6a4a;">La commande peut maintenant être préparée et expédiée.</p>
  `;

  return baseLayout(`Paiement reçu — ${orderId}`, body);
}

// ── EmailService ─────────────────────────────────────────────────────────────

class EmailService {
  constructor() {
    this._transporter = null;
  }

  _getTransporter() {
    if (!this._transporter) {
      this._transporter = buildTransporter();
    }
    return this._transporter;
  }

  async _send(options) {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('[EmailService] GMAIL_USER ou GMAIL_APP_PASSWORD manquant — email ignoré');
      return;
    }
    try {
      const info = await this._getTransporter().sendMail(options);
      console.log(`[EmailService] Email envoyé : ${options.subject} → ${options.to} (${info.messageId})`);
    } catch (err) {
      console.error(`[EmailService] Échec envoi email "${options.subject}" :`, err.message);
    }
  }

  // Appelé à la création d'une commande
  async onOrderCreated(order) {
    const { customer = {} } = order;

    await Promise.all([
      // Admin : nouvelle commande
      this._send({
        from: `"Cheirobom" <${process.env.GMAIL_USER}>`,
        to: ADMIN_EMAIL,
        subject: `[Cheirobom] Nouvelle commande — ${order.orderId}`,
        html: newOrderAdminHtml(order),
      }),

      // Client : confirmation de réception
      customer.email
        ? this._send({
            from: `"Cheirobom" <${process.env.GMAIL_USER}>`,
            to: customer.email,
            subject: `Votre commande Cheirobom — ${order.orderId}`,
            html: confirmationClientHtml(order),
          })
        : Promise.resolve(),
    ]);
  }

  // Appelé quand le paiement est confirmé (statut 'paid')
  async onPaymentConfirmed(order) {
    await this._send({
      from: `"Cheirobom" <${process.env.GMAIL_USER}>`,
      to: ADMIN_EMAIL,
      subject: `[Cheirobom] Paiement reçu — ${order.orderId}`,
      html: paymentConfirmedAdminHtml(order),
    });
  }
}

module.exports = new EmailService();
