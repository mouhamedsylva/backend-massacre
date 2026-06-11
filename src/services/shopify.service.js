/**
 * shopify.service.js
 * Crée un Draft Order dans Shopify via l'Admin API REST.
 *
 * Documentation : https://shopify.dev/docs/api/admin-rest/2026-04/resources/draftorder
 */

// node-fetch v3 est un module ESM, on utilise un import dynamique depuis un module CJS
// ou on reste sur node-fetch v2. Pour compatibilité maximale avec Node 18 on utilise
// la version globale fetch disponible nativement depuis Node 18.
const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN; // ex: massacre-officiel.myshopify.com
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN; // Token d'accès Admin API (jamais exposé)
const API_VERSION = "2026-04";

/**
 * Mappe les URLs des vues en `properties` Shopify (champs visibles dans l'admin).
 *
 * @param {Object} imageUrls - { front?: string, back?: string, left?: string, right?: string }
 * @returns {Array<{name: string, value: string}>}
 */
function buildProperties(imageUrls) {
  const labelMap = {
    front: "🖼 Maquette Face",
    back: "🖼 Maquette Dos",
    left: "🖼 Maquette Gauche",
    right: "🖼 Maquette Droite",
  };

  return Object.entries(imageUrls)
    .filter(([, url]) => url) // Ignorer les vues sans URL
    .map(([view, url]) => ({
      name: labelMap[view] || `Maquette ${view}`,
      value: url,
    }));
}

/**
 * Crée un Draft Order dans le back-office Shopify.
 *
 * @param {Object} params
 * @param {Object} params.customer        - { email, first_name, last_name }
 * @param {string} params.product_title   - Nom du produit personnalisé
 * @param {Object} params.imageUrls       - URLs des maquettes par vue
 * @returns {Promise<Object>}             - La réponse complète de l'API Shopify
 */
async function createDraftOrder({ customer, product_title, imageUrls }) {
  if (!SHOPIFY_STORE || !SHOPIFY_TOKEN) {
    throw new Error(
      "Variables d'environnement Shopify manquantes (SHOPIFY_STORE_DOMAIN ou SHOPIFY_ADMIN_API_TOKEN)."
    );
  }

  const endpoint = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/draft_orders.json`;

  const body = {
    draft_order: {
      line_items: [
        {
          title: product_title,
          quantity: 1,
          // Prix à 0 : l'admin ajustera manuellement avant d'envoyer la facture
          price: "0.00",
          requires_shipping: true,
          taxable: true,
          properties: buildProperties(imageUrls),
        },
      ],
      customer: {
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
      },
      note: `Demande de personnalisation sur-mesure depuis le configurateur web.\nSoumis le : ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`,
      // Le Draft Order reste ouvert — l'admin doit manuellement cliquer "Envoyer la facture"
      send_receipt: false,
      send_fulfillment_receipt: false,
      // Tag pour filtrer facilement dans l'admin Shopify
      tags: "configurateur, sur-mesure, devis-en-attente",
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Token d'accès Admin API (Bearer token ou X-Shopify-Access-Token selon le type d'app)
      "X-Shopify-Access-Token": SHOPIFY_TOKEN,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    // Shopify renvoie les erreurs dans data.errors
    const shopifyErrors = JSON.stringify(data.errors || data);
    throw new Error(
      `Shopify API [${response.status}] : ${shopifyErrors}`
    );
  }

  return data.draft_order;
}

module.exports = { createDraftOrder };