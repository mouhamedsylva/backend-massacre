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
  const { customer, product_title, images } = req.body;

  // ── Étape 1 : Upload Cloudinary ──────────────────────────────────────────────
  let imageUrls;
  try {
    console.log(
      `[Devis] Upload des images pour ${customer.email} (${Object.keys(images).length} vues)...`
    );
    imageUrls = await uploadAllViews(images);
    console.log(`[Devis] ✅ Images uploadées :`, Object.keys(imageUrls));
  } catch (err) {
    console.error("[Devis] ❌ Erreur Cloudinary :", err.message);
    return res.status(502).json({
      success: false,
      error:
        "Impossible de stocker les images. Veuillez réessayer dans quelques instants.",
    });
  }

  // ── Étape 2 : Création du Draft Order Shopify ──────────────────────────────
  let draftOrder;
  try {
    console.log(`[Devis] Création du Draft Order Shopify...`);
    draftOrder = await createDraftOrder({ customer, product_title, imageUrls });
    console.log(
      `[Devis] ✅ Draft Order créé : #${draftOrder.name} (id: ${draftOrder.id})`
    );
  } catch (err) {
    console.error("[Devis] ❌ Erreur Shopify :", err.message);
    return res.status(502).json({
      success: false,
      error:
        "Votre devis n'a pas pu être enregistré. Notre équipe a été notifiée. Veuillez réessayer ou nous contacter.",
    });
  }

  // ── Étape 3 : Réponse succès ───────────────────────────────────────────────
  return res.status(201).json({
    success: true,
    message:
      "Votre demande de devis a bien été reçue ! Notre équipe vous contactera sous 24–48h.",
    draft_order: {
      id: draftOrder.id,
      name: draftOrder.name,          // Ex: "#D001"
      status: draftOrder.status,      // "open"
      created_at: draftOrder.created_at,
    },
  });
});

module.exports = router;