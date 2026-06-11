/**
 * validate.js
 * Middleware de validation pour la route POST /submit-devis
 *
 * Vérifie que le body contient bien :
 *  - customer.email, customer.first_name, customer.last_name
 *  - images : objet avec au moins une vue (front/back/left/right) en base64
 *  - product_title (string)
 */

// Regex simplifiée pour valider un email
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Les 4 clés de vues acceptées
const VALID_VIEWS = ["front", "back", "left", "right"];

// Vérifie qu'une string est bien un dataURL base64 image (PNG ou JPEG)
function isBase64Image(str) {
  return (
    typeof str === "string" &&
    (str.startsWith("data:image/png;base64,") ||
      str.startsWith("data:image/jpeg;base64,"))
  );
}

function validateDevis(req, res, next) {
  const { customer, images, product_title } = req.body;
  const errors = [];

  // ── Validation client ──────────────────────────────────────────────────────
  if (!customer || typeof customer !== "object") {
    errors.push("Le champ 'customer' est obligatoire.");
  } else {
    if (!customer.email || !EMAIL_REGEX.test(customer.email)) {
      errors.push("L'email client est invalide ou manquant.");
    }
    if (!customer.first_name || typeof customer.first_name !== "string") {
      errors.push("Le prénom du client est obligatoire.");
    }
    if (!customer.last_name || typeof customer.last_name !== "string") {
      errors.push("Le nom du client est obligatoire.");
    }
  }

  // ── Validation produit ─────────────────────────────────────────────────────
  if (!product_title || typeof product_title !== "string") {
    errors.push("Le champ 'product_title' est obligatoire.");
  }

  // ── Validation images ──────────────────────────────────────────────────────
  if (!images || typeof images !== "object") {
    errors.push("Le champ 'images' est obligatoire.");
  } else {
    const keys = Object.keys(images);

    // Au moins une vue doit être fournie
    const validKeys = keys.filter((k) => VALID_VIEWS.includes(k));
    if (validKeys.length === 0) {
      errors.push(
        "Au moins une image de vue (front/back/left/right) est requise."
      );
    }

    // Clés non reconnues
    const unknownKeys = keys.filter((k) => !VALID_VIEWS.includes(k));
    if (unknownKeys.length > 0) {
      errors.push(`Clés d'images inconnues : ${unknownKeys.join(", ")}.`);
    }

    // Vérification du format base64 de chaque vue fournie
    for (const key of validKeys) {
      if (!isBase64Image(images[key])) {
        errors.push(
          `L'image '${key}' doit être un dataURL base64 valide (PNG ou JPEG).`
        );
      }
    }
  }

  // ── Réponse ────────────────────────────────────────────────────────────────
  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  next();
}

module.exports = { validateDevis };