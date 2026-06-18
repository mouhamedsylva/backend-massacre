/**
 * test-cloudinary.js
 * Test direct de l'upload Cloudinary (sans Shopify)
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('🧪 Test de connexion Cloudinary\n');

// Afficher la configuration (masquer l'API Secret)
console.log('📋 Configuration détectée :');
console.log('   Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || '❌ MANQUANT');
console.log('   API Key:', process.env.CLOUDINARY_API_KEY || '❌ MANQUANT');
console.log('   API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ Présent (masqué)' : '❌ MANQUANT');
console.log('');

// Configurer Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Image de test (1x1 pixel PNG en base64)
const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

console.log('📤 Tentative d\'upload d\'une image de test sur Cloudinary...\n');

cloudinary.uploader
  .upload(testImage, {
    folder: 'maquettes-test',
    resource_type: 'image',
    public_id: `test-${Date.now()}`,
  })
  .then((result) => {
    console.log('✅ SUCCÈS ! Upload Cloudinary fonctionne !\n');
    console.log('📋 Résultat :');
    console.log('   URL:', result.secure_url);
    console.log('   Public ID:', result.public_id);
    console.log('   Format:', result.format);
    console.log('   Taille:', result.bytes, 'bytes');
    console.log('');
    console.log('🎉 Cloudinary est correctement configuré !');
    console.log('💡 Le problème vient probablement d\'ailleurs (Shopify ou autre).');
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ ERREUR ! Upload Cloudinary a échoué !\n');
    console.log('📋 Message d\'erreur :');
    console.log('   ', err.message);
    console.log('');
    console.log('📋 Détails de l\'erreur :');
    console.log(err);
    console.log('');
    console.log('💡 Causes possibles :');
    console.log('   1. Cloud Name incorrect');
    console.log('   2. API Key incorrect');
    console.log('   3. API Secret incorrect');
    console.log('   4. Compte Cloudinary non vérifié');
    console.log('   5. Quota Cloudinary dépassé');
    console.log('');
    console.log('🔧 Solutions :');
    console.log('   1. Vérifier les valeurs sur https://console.cloudinary.com/settings/api-keys');
    console.log('   2. Copier-coller exactement (pas d\'espaces)');
    console.log('   3. Vérifier votre email pour valider le compte');
    process.exit(1);
  });
