/**
 * zones.js
 * Routes pour gérer les zones éditables des produits (metafields)
 */

const express = require('express');
const router = express.Router();

// Importation du service Shopify (on va l'étendre)
const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;
const API_VERSION = '2024-10';

/**
 * GET /api/zones/product/:productId
 * Récupère les informations d'un produit et ses zones éditables
 */
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID requis' });
    }

    // Query GraphQL pour récupérer le produit avec ses metafields et images
    const query = `
      query getProduct($id: ID!) {
        product(id: $id) {
          id
          title
          handle
          metafields(first: 10) {
            edges {
              node {
                namespace
                key
                value
                type
              }
            }
          }
          images(first: 4) {
            edges {
              node {
                url
                altText
              }
            }
          }
        }
      }
    `;

    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        },
        body: JSON.stringify({
          query,
          variables: { id: productId }
        }),
      }
    );

    const data = await response.json();

    if (data.errors) {
      console.error('Shopify GraphQL errors:', data.errors);
      return res.status(500).json({ error: 'Erreur Shopify API', details: data.errors });
    }

    if (!data.data || !data.data.product) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    const product = data.data.product;

    // Extraire les images (on suppose que les 4 premières sont front, back, left, right)
    const images = {
      front: product.images.edges[0]?.node.url || null,
      back: product.images.edges[1]?.node.url || null,
      left: product.images.edges[2]?.node.url || null,
      right: product.images.edges[3]?.node.url || null,
    };

    // Chercher le metafield "Zones Editables"
    const zonesMetafield = product.metafields.edges.find(
      edge => edge.node.namespace === 'custom' && edge.node.key === 'zones_editables'
    );

    let zones = null;
    if (zonesMetafield) {
      try {
        zones = JSON.parse(zonesMetafield.node.value);
      } catch (e) {
        console.error('Erreur parsing zones:', e);
      }
    }

    res.json({
      productId: product.id,
      title: product.title,
      handle: product.handle,
      images,
      zones: zones || { front: [], back: [], left: [], right: [] }
    });

  } catch (error) {
    console.error('[GET /api/zones/product] Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * POST /api/zones/save
 * Sauvegarde les zones éditables dans le metafield du produit
 */
router.post('/save', async (req, res) => {
  try {
    const { productId, zones } = req.body;

    if (!productId || !zones) {
      return res.status(400).json({ error: 'productId et zones requis' });
    }

    // Valider la structure des zones
    if (typeof zones !== 'object' || !zones.front) {
      return res.status(400).json({ error: 'Format zones invalide' });
    }

    // Mutation GraphQL pour créer ou mettre à jour le metafield
    const mutation = `
      mutation updateProductMetafield($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            metafields(first: 10) {
              edges {
                node {
                  namespace
                  key
                  value
                }
              }
            }
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
        id: productId,
        metafields: [
          {
            namespace: 'custom',
            key: 'zones_editables',
            type: 'json',
            value: JSON.stringify(zones)
          }
        ]
      }
    };

    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        },
        body: JSON.stringify({ query: mutation, variables }),
      }
    );

    const data = await response.json();

    if (data.errors) {
      console.error('Shopify GraphQL errors:', data.errors);
      return res.status(500).json({ error: 'Erreur Shopify API', details: data.errors });
    }

    if (data.data?.productUpdate?.userErrors?.length > 0) {
      const errors = data.data.productUpdate.userErrors;
      console.error('User errors:', errors);
      return res.status(400).json({ error: 'Erreur validation Shopify', details: errors });
    }

    res.json({
      success: true,
      message: 'Zones éditables sauvegardées avec succès',
      product: data.data.productUpdate.product
    });

  } catch (error) {
    console.error('[POST /api/zones/save] Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

/**
 * GET /api/zones/products
 * Liste tous les produits avec leurs zones éditables (pour future interface de gestion)
 */
router.get('/products', async (req, res) => {
  try {
    const query = `
      query {
        products(first: 50) {
          edges {
            node {
              id
              title
              handle
              featuredImage {
                url
              }
              metafields(first: 10, namespace: "custom") {
                edges {
                  node {
                    key
                    value
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(
      `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        },
        body: JSON.stringify({ query }),
      }
    );

    const data = await response.json();

    if (data.errors) {
      return res.status(500).json({ error: 'Erreur Shopify API', details: data.errors });
    }

    const products = data.data.products.edges.map(edge => {
      const product = edge.node;
      const zonesMetafield = product.metafields.edges.find(
        m => m.node.key === 'zones_editables'
      );

      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        image: product.featuredImage?.url,
        hasZones: !!zonesMetafield
      };
    });

    res.json({ products });

  } catch (error) {
    console.error('[GET /api/zones/products] Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

module.exports = router;
