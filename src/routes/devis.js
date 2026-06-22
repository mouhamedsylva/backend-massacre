/**
 * devis.js
 * Route principale : POST /submit-devis
 *
 * Orchestration complète du workflow :
 *   1. Validation du body (via middleware)
 *   2. Upload des images sur Cloudinary
 *   3. Création du Draft Order Shopify
 *   4. Réponse JSON au front-end Shopify
 */

const express = require("express");
const router = express.Router();

const { validateDevis } = require("../middlewares/validate");
const { uploadAllViews } = require("../services/cloudinary.service");
const { createDraftOrder } = require("../services/shopify.service");
const { sendCustomerConfirmation, sendAdminNotification } = require("../services/email.service");
const { saveSession } = require("./visualize");

/**
 * POST /submit-devis
 *
 * Body attendu (JSON) :
 * {
 *   "customer": {
 *     "email": "client@exemple.com",
 *     "first_name": "Jean",
 *     "last_name": "Dupont"
 *   },
 *   "product_title": "T-Shirt Customisé - Massacre",
 *   "images": {
 *     "front": "data:image/png;base64,...",
 *     "back":  "data:image/png;base64,...",   // optionnel
 *     "left":  "data:image/png;base64,...",   // optionnel
 *     "right": "data:image/png;base64,..."    // optionnel
 *   }
 * }
 */
router.post("/submit-devis", validateDevis, async (req, res) => {
  const { customer, product_title, product_price, variant_id, images } = req.body;

  // 🔍 Debug : Afficher les données reçues
  console.log(`[Devis] 🔍 Données reçues :`);
  console.log(`   variant_id: "${variant_id}" (type: ${typeof variant_id})`);
  console.log(`   product_title: "${product_title}"`);
  console.log(`   product_price: "${product_price}" (type: ${typeof product_price})`);
  console.log(`   customer: ${customer.first_name} ${customer.last_name}`);
  
  // 🔍 Debug : Vérifier si le variant_id est valide
  if (variant_id && variant_id.includes('gid://shopify/ProductVariant/')) {
    console.log(`[Devis] ✅ variant_id valide détecté`);
  } else {
    console.log(`[Devis] ⚠️ variant_id manquant ou invalide - fallback sur custom item`);
  };

  // ── Étape 1 : Upload Cloudinary ──────────────────────────────────────────────
  let imageUrls, sessionId;
  try {
    console.log(
      `[Devis] Upload des images pour ${customer.email} (${Object.keys(images).length} vues)...`
    );
    const uploadResult = await uploadAllViews(images);
    imageUrls = uploadResult.urls;
    sessionId = uploadResult.sessionId;
    console.log(`[Devis] ✅ Images uploadées (session: ${sessionId}) :`, Object.keys(imageUrls));
    
    // Sauvegarder la session pour la page de visualisation
    saveSession(sessionId, imageUrls, customer);
  } catch (err) {
    console.error("[Devis] ❌ Erreur Cloudinary :", err.message);
    return res.status(502).json({
      success: false,
      error:
        "Impossible de stocker les images. Veuillez réessayer dans quelques instants.",
    });
  }

  // ── Étape 2 : Créer le Draft Order Shopify ────────────────────────────────────
  let draftOrder;
  try {
    console.log("[Devis] Création du Draft Order Shopify...");
    console.log(`[Devis] 🔍 Paramètres Draft Order :`);
    console.log(`   product_title: "${product_title}"`);
    console.log(`   product_price: "${product_price}"`);
    
    draftOrder = await createDraftOrder({
      customer,
      product_title,
      product_price,
      variant_id,
      imageUrls,
      sessionId,
    });
    console.log(`[Devis] ✅ Draft Order créé : ${draftOrder.name} (ID: ${draftOrder.id})`);
  } catch (err) {
    console.error("[Devis] ❌ Erreur Shopify :", err.message);
    return res.status(502).json({
      success: false,
      error: "Votre devis n'a pas pu être enregistré. Notre équipe a été notifiée. Veuillez réessayer ou nous contacter.",
    });
  }

  // Logs détaillés pour l'admin
  console.log(`[Devis] 📋 Détails du devis :`);
  console.log(`   Client: ${customer.first_name} ${customer.last_name}`);
  console.log(`   Email: ${customer.email}`);
  if (customer.phone) {
    console.log(`   Téléphone: ${customer.phone}`);
  }
  if (customer.message) {
    console.log(`   Message: ${customer.message}`);
  }
  console.log(`   Produit: ${product_title}`);
  console.log(`   Draft Order: ${draftOrder.name}`);
  console.log(`   Images:`);
  Object.entries(imageUrls).forEach(([view, url]) => {
    console.log(`   - ${view}: ${url}`);
  });

  // ── Étape 3 : Envoyer les emails ──────────────────────────────────────────────
  try {
    console.log("[Devis] Envoi des emails...");
    
    // Email de confirmation au client
    await sendCustomerConfirmation({
      customer,
      product_title,
      imageUrls,
      draftOrder
    });
    
    // Email de notification à l'admin
    await sendAdminNotification({
      customer,
      product_title,
      imageUrls,
      draftOrder
    });
    
    console.log("[Devis] ✅ Emails envoyés avec succès");
  } catch (emailError) {
    console.error("[Devis] ⚠️ Erreur lors de l'envoi des emails (non-bloquant) :", emailError.message);
    // Ne pas bloquer la réponse si les emails échouent
  }

  // ── Étape 4 : Réponse succès ───────────────────────────────────────────────
  return res.status(201).json({
    success: true,
    message:
      "Votre demande de devis a bien été reçue ! Vérifiez votre boîte mail pour confirmation.",
    draft_order: draftOrder,
    customer_info: {
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
    },
    images: imageUrls,
  });
});

module.exports = router;