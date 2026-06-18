/**
 * shopify.service.js
 * Crée un Draft Order dans Shopify via l'Admin API GraphQL.
 *
 * Documentation : https://shopify.dev/docs/api/admin-graphql/latest/mutations/draftOrderCreate
 */

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN; // ex: massacre-officiel.myshopify.com
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN; // Token d'accès Admin API
const API_VERSION = "2024-10"; // Version stable de l'API Shopify

/**
 * Crée un Draft Order dans le back-office Shopify via GraphQL.
 *
 * @param {Object} params
 * @param {Object} params.customer        - { email, first_name, last_name }
 * @param {string} params.product_title   - Nom du produit personnalisé
 * @param {Object} params.imageUrls       - URLs des maquettes par vue
 * @returns {Promise<Object>}             - Le Draft Order créé
 */
async function createDraftOrder({ customer, product_title, imageUrls }) {
  if (!SHOPIFY_STORE || !SHOPIFY_TOKEN) {
    throw new Error(
      "Variables d'environnement Shopify manquantes (SHOPIFY_STORE_DOMAIN ou SHOPIFY_ADMIN_API_TOKEN)."
    );
  }

  // Construire les custom attributes (properties) à partir des URLs
  const customAttributes = Object.entries(imageUrls)
    .filter(([, url]) => url)
    .map(([view, url]) => ({
      key: `Maquette ${view}`,
      value: url
    }));

  // Mutation GraphQL pour créer un Draft Order
  const mutation = `
    mutation draftOrderCreate($input: DraftOrderInput!) {
      draftOrderCreate(input: $input) {
        draftOrder {
          id
          name
          status
          createdAt
          invoiceUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      email: customer.email,
      note: `Demande de personnalisation sur-mesure depuis le configurateur web.\\nSoumis le : ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}`,
      tags: ["configurateur", "sur-mesure", "devis-en-attente"],
      customAttributes: [
        { key: "Prénom", value: customer.first_name },
        { key: "Nom", value: customer.last_name },
        ...customAttributes
      ],
      lineItems: [
        {
          title: product_title,
          quantity: 1,
          originalUnitPrice: "0.00",
          taxable: true,
          requiresShipping: true,
          customAttributes: customAttributes
        }
      ]
    }
  };

  const endpoint = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errors = JSON.stringify(data.errors || data);
    throw new Error(`Shopify GraphQL API [${response.status}] : ${errors}`);
  }

  if (data.errors) {
    throw new Error(`Shopify GraphQL Errors : ${JSON.stringify(data.errors)}`);
  }

  if (data.data?.draftOrderCreate?.userErrors?.length > 0) {
    const userErrors = data.data.draftOrderCreate.userErrors
      .map(e => `${e.field}: ${e.message}`)
      .join(', ');
    throw new Error(`Shopify Draft Order Errors : ${userErrors}`);
  }

  return data.data.draftOrderCreate.draftOrder;
}

module.exports = { createDraftOrder };