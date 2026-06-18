/**
 * test-draft-order.js
 * Script de test pour vérifier que l'API crée bien un Draft Order Shopify
 * 
 * Usage :
 *   node test-draft-order.js
 *   node test-draft-order.js https://votre-url.railway.app/submit-devis
 */

// Utiliser fetch natif de Node 18+
const API_URL = process.argv[2] || 'https://backend-massacre-production.up.railway.app/submit-devis';

console.log('🧪 Test de création de Draft Order Shopify');
console.log('📍 URL:', API_URL);
console.log('');

// Image 1x1 pixel PNG en base64 (pour le test)
const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const testData = {
  customer: {
    email: 'test-configurateur@example.com',
    first_name: 'Jean',
    last_name: 'Test'
  },
  product_title: '🧪 T-Shirt Test Configurateur',
  images: {
    front: TINY_PNG,
    back: TINY_PNG
  }
};

console.log('📤 Envoi de la requête...');
console.log('📧 Client:', testData.customer.email);
console.log('🎨 Produit:', testData.product_title);
console.log('🖼️  Vues:', Object.keys(testData.images).join(', '));
console.log('');

fetch(API_URL, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'User-Agent': 'test-draft-order.js'
  },
  body: JSON.stringify(testData)
})
.then(async res => {
  const data = await res.json();
  
  console.log('📥 Réponse HTTP:', res.status, res.statusText);
  console.log('');
  
  if (res.ok) {
    console.log('✅ SUCCÈS !');
    console.log('');
    console.log('📋 Draft Order créé :');
    console.log('   ID:', data.draft_order?.id);
    console.log('   Nom:', data.draft_order?.name);
    console.log('   Statut:', data.draft_order?.status);
    console.log('');
    console.log('💡 Vérifiez dans Shopify Admin :');
    console.log('   Orders → Drafts');
    console.log('');
    console.log('🎉 Le système fonctionne correctement !');
  } else {
    console.log('❌ ERREUR');
    console.log('');
    console.log('Message:', data.error || data.message);
    console.log('');
    console.log('Réponse complète:', JSON.stringify(data, null, 2));
    console.log('');
    console.log('💡 Vérifications à faire :');
    console.log('   1. Le serveur backend est démarré');
    console.log('   2. Le fichier .env contient toutes les clés');
    console.log('   3. Les clés Shopify et Cloudinary sont valides');
    console.log('   4. Les permissions write_draft_orders sont activées');
    process.exit(1);
  }
})
.catch(err => {
  console.log('❌ ERREUR DE CONNEXION');
  console.log('');
  console.log('Message:', err.message);
  console.log('');
  console.log('💡 Causes possibles :');
  console.log('   1. Le serveur backend n\'est pas démarré');
  console.log('   2. L\'URL est incorrecte');
  console.log('   3. Problème de réseau/firewall');
  console.log('');
  console.log('🔧 Pour démarrer le serveur :');
  console.log('   cd microservice');
  console.log('   npm install');
  console.log('   npm start');
  process.exit(1);
});
