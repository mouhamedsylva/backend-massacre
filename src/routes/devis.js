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
// const { createDraftOrder } = require("../services/shopify.service"); // Désactivé temporairement

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

  // ── Étape 2 : Créer une commande factice (pour présentation) ──────────────────
  // Au lieu de Shopify API, on retourne simplement un succès
  // L'admin recevra les infos par email ou les verra dans les logs
  
  const draftOrder = {
    id: `draft-${Date.now()}`,
    name: `#DEMO-${Math.floor(Math.random() * 1000)}`,
    status: "pending_review",
    created_at: new Date().toISOString(),
  };

  console.log(`[Devis] ✅ Devis enregistré pour ${customer.email}`);
  console.log(`[Devis] 📋 Détails :`);
  console.log(`   Client: ${customer.first_name} ${customer.last_name}`);
  console.log(`   Email: ${customer.email}`);
  if (customer.phone) {
    console.log(`   Téléphone: ${customer.phone}`);
  }
  if (customer.message) {
    console.log(`   Message: ${customer.message}`);
  }
  console.log(`   Produit: ${product_title}`);
  console.log(`   Images:`);
  Object.entries(imageUrls).forEach(([view, url]) => {
    console.log(`   - ${view}: ${url}`);
  });

  // ── Étape 3 : Réponse succès ───────────────────────────────────────────────
  return res.status(201).json({
    success: true,
    message:
      "Votre demande de devis a bien été reçue ! Notre équipe vous contactera sous 24–48h.",
    draft_order: draftOrder,
    customer_info: {
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
    },
    images: imageUrls,
  });
});

module.exports = router;