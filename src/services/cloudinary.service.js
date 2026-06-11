/**
 * cloudinary.service.js
 * Gère l'upload des images base64 (exports du canvas Fabric.js) vers Cloudinary.
 *
 * Retourne un objet { front?, back?, left?, right? } avec les URLs publiques HTTPS.
 */

const cloudinary = require("cloudinary").v2;
const { v4: uuidv4 } = require("uuid");

// Configuration via variables d'environnement (jamais en dur dans le code)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Toujours des URLs HTTPS
});

/**
 * Upload une image base64 sur Cloudinary dans le dossier "maquettes/".
 *
 * @param {string} base64DataUrl - La chaîne dataURL complète (ex: "data:image/png;base64,...")
 * @param {string} viewName      - Nom de la vue : "front" | "back" | "left" | "right"
 * @param {string} sessionId     - Identifiant unique de la session (pour grouper les 4 vues)
 * @returns {Promise<string>}    - L'URL publique HTTPS de l'image uploadée
 */
async function uploadImage(base64DataUrl, viewName, sessionId) {
  const publicId = `maquettes/${sessionId}_${viewName}`;

  const result = await cloudinary.uploader.upload(base64DataUrl, {
    public_id: publicId,
    overwrite: true,
    resource_type: "image",
    // Qualité et format optimisés pour la consultation admin (pas pour l'impression finale)
    transformation: [{ quality: "auto:best", fetch_format: "png" }],
    // Tags pour faciliter la recherche / purge dans Cloudinary
    tags: ["maquette", "massacre-officiel", viewName],
  });

  return result.secure_url;
}

/**
 * Upload toutes les vues fournies dans l'objet `images`.
 *
 * @param {Object} images - { front?: string, back?: string, left?: string, right?: string }
 * @returns {Promise<Object>} - Mêmes clés avec les URLs Cloudinary en valeur
 */
async function uploadAllViews(images) {
  // Un identifiant unique par soumission pour regrouper les 4 vues dans Cloudinary
  const sessionId = uuidv4().slice(0, 8);

  const uploadPromises = Object.entries(images).map(
    async ([viewName, base64DataUrl]) => {
      try {
        const url = await uploadImage(base64DataUrl, viewName, sessionId);
        return [viewName, url];
      } catch (err) {
        // On log l'erreur mais on ne bloque pas les autres vues
        console.error(
          `[Cloudinary] Échec upload vue "${viewName}" :`,
          err.message
        );
        return [viewName, null];
      }
    }
  );

  const results = await Promise.all(uploadPromises);

  // Convertir le tableau [[key, url], ...] en objet { key: url }
  const urls = Object.fromEntries(results.filter(([, url]) => url !== null));

  if (Object.keys(urls).length === 0) {
    throw new Error("Toutes les images ont échoué lors de l'upload Cloudinary.");
  }

  return urls;
}

module.exports = { uploadAllViews };