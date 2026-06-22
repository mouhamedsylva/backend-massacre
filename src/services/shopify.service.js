/**
 * shopify.service.js
 * Crée un Draft Order dans Shopify via l'Admin API GraphQL.
 *
 * Documentation : https://shopify.dev/docs/api/admin-graphql/latest/mutations/draftOrderCreate
 */


const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = "2024-10";

async function createDraftOrder({ customer, product_title, product_price, variant_id, imageUrls, sessionId }) {
  if (!SHOPIFY_STORE || !SHOPIFY_TOKEN) {
    throw new Error("Variables d'environnement Shopify manquantes.");
  }

  console.log(`[Shopify] 🔍 Création Draft Order avec :`);
  console.log(`   product_title: "${product_title}"`);
  console.log(`   product_price: "${product_price}"`);
  console.log(`   variant_id: "${variant_id}"`);
  console.log(`   customer: ${customer.first_name} ${customer.last_name} (${customer.email})`);

  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const visualizationUrl = `${baseUrl}/visualize/${sessionId}`;

  const noteText = `Demande de personnalisation sur-mesure depuis le configurateur web.
Soumis le : ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}

📸 VISUALISER LES MAQUETTES (cliquez sur le lien) :
${visualizationUrl}

💡 Toutes les maquettes sont disponibles en haute qualité sur cette page.`;

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

  // Construire le lineItem selon qu'on a un variantId ou non
  let lineItem;
  if (variant_id) {
    // ✅ Vrai produit Shopify → image + nom + prix automatiques
    lineItem = {
      variantId: variant_id, // ex: "gid://shopify/ProductVariant/123456789"
      quantity: 1,
      customAttributes: [
        { key: "🔗 Voir les maquettes", value: visualizationUrl }
      ]
    };
    console.log(`[Shopify] ✅ Utilisation du vrai variant Shopify : ${variant_id}`);
  } else {
    // Fallback : custom item si pas de variantId
    const safeTitle = (product_title && product_title.trim()) || "Produit Personnalisé";
    const safePrice = parseFloat(product_price);
    console.warn(`[Shopify] ⚠️ Pas de variant_id, fallback custom item`);


    console.error(`[Shopify] ❌ FALLBACK activé — variant_id manquant ou invalide`);
    console.error(`[Shopify]    product_title reçu: "${product_title}"`);
    console.error(`[Shopify]    product_price reçu: "${product_price}" → parsed: ${safePrice}`);
    lineItem = {
      title: safeTitle,
      quantity: 1,
      originalUnitPrice: (isNaN(safePrice) ? 0 : safePrice).toFixed(2),
      taxable: true,
      requiresShipping: true,
      customAttributes: [
        { key: "🔗 Voir les maquettes", value: visualizationUrl }
      ]
    };
  }

  const variables = {
    input: {
      email: customer.email,
      note: noteText,
      tags: ["configurateur", "sur-mesure", "devis-en-attente"],
      billingAddress: {
        firstName: customer.first_name,
        lastName: customer.last_name,
      },
      customAttributes: [
        { key: "Prénom", value: customer.first_name },
        { key: "Nom", value: customer.last_name },
        { key: "🔗 Visualisation", value: visualizationUrl }
      ],
      lineItems: [lineItem]
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
    throw new Error(`Shopify GraphQL API [${response.status}] : ${JSON.stringify(data.errors || data)}`);
  }
  if (data.errors) {
    throw new Error(`Shopify GraphQL Errors : ${JSON.stringify(data.errors)}`);
  }
  if (data.data?.draftOrderCreate?.userErrors?.length > 0) {
    const userErrors = data.data.draftOrderCreate.userErrors
      .map(e => `${e.field}: ${e.message}`).join(', ');
    throw new Error(`Shopify Draft Order Errors : ${userErrors}`);
  }

  return data.data.draftOrderCreate.draftOrder;
}

module.exports = { createDraftOrder };