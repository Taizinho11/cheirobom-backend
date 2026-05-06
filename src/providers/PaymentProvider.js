/**
 * Interface commune pour tous les fournisseurs de paiement.
 * Créer un nouveau provider = étendre cette classe et implémenter les 3 méthodes.
 *
 * Statuts normalisés : 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired'
 */
class PaymentProvider {
  /**
   * @param {object} params
   * @param {string} params.orderId
   * @param {number} params.amount       Montant en centimes (ex : 4200 = 42,00 €)
   * @param {string} params.currency     Code ISO 4217 (ex : 'EUR')
   * @param {string} params.description
   * @param {string} params.redirectUrl  URL de retour après paiement
   * @param {string} params.webhookUrl   URL pour les notifications asynchrones
   * @param {object} params.metadata     Données libres à attacher au paiement
   * @returns {Promise<{ paymentId: string, checkoutUrl: string }>}
   */
  async createPayment(params) {
    throw new Error(`${this.constructor.name} must implement createPayment()`);
  }

  /**
   * @param {string} paymentId
   * @returns {Promise<{ paymentId: string, status: string, paid: boolean, amount: number, currency: string, metadata: object }>}
   */
  async getPayment(paymentId) {
    throw new Error(`${this.constructor.name} must implement getPayment()`);
  }

  /**
   * Reçoit le corps brut du webhook et retourne le statut normalisé.
   * Ne pas faire confiance aux données du webhook — toujours vérifier via getPayment().
   *
   * @param {object} body     Corps parsé de la requête webhook
   * @param {object} headers  En-têtes HTTP (pour vérification de signature)
   * @returns {Promise<{ paymentId: string, status: string, paid: boolean }>}
   */
  async handleWebhook(body, headers) {
    throw new Error(`${this.constructor.name} must implement handleWebhook()`);
  }
}

module.exports = PaymentProvider;
