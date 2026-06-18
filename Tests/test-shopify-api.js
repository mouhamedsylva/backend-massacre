/**
 * test-shopify-api.js
 * Test direct de l'API Shopify (sans Cloudinary)
 */

require('dotenv').config();

console.log('🧪 Test de connexion API Shopify\n');

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

// Afficher la configuration (masquer le token)
console.log('📋 Configuration détectée :');
console.log('   Store Domain:', SHOPIFY_STORE || '❌ MANQUANT');
console.log('   Admin Token:', SHOPIFY_TOKEN ? `✅ ${SHOPIFY_TOKEN.substring(0, 10)}...` : '❌ MANQUANT');
console.log('');

if (!SHOPIFY_STORE || !SHOPIFY_TOKEN) {
  console.log('❌ Configuration incomplète !');
  process.exit(1);
}

// Test 1 : Vérifier que le store existe (GET /admin/api/2024-10/shop.json)
console.log('📤 Test 1 : Vérification du store...');
const shopUrl = `https://${SHOPIFY_STORE}/admin/api/2024-10/shop.json`;
console.log('   URL:', shopUrl);
console.log('');

fetch(shopUrl, {
  method: 'GET',
  headers: {
    'X-Shopify-Access-Token': SHOPIFY_TOKEN,
  },
})
  .then(async (res) => {
    const data = await res.json();
    
    if (res.ok) {
      console.log('✅ Store trouvé !');
      console.log('   Nom:', data.shop.name);
      console.log('   Email:', data.shop.email);
      console.log('   Domaine:', data.shop.myshopify_domain);
      console.log('');
      
      // Test 2 : Lister les Draft Orders existants
      console.log('📤 Test 2 : Lecture des Draft Orders...');
      const draftOrdersUrl = `https://${SHOPIFY_STORE}/admin/api/2024-10/draft_orders.json?limit=1`;
      
      return fetch(draftOrdersUrl, {
        method: 'GET',
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        },
      });
    } else {
      console.log('❌ ERREUR ! Store non trouvé !');
      console.log('   Status:', res.status, res.statusText);
      console.log('   Réponse:', JSON.stringify(data, null, 2));
      console.log('');
      console.log('💡 Causes possibles :');
      console.log('   1. SHOPIFY_STORE_DOMAIN incorrect');
      console.log('   2. Token invalide ou expiré');
      console.log('   3. Store Shopify désactivé');
      console.log('');
      console.log('🔧 Vérifiez :');
      console.log('   1. Le domaine doit être : votre-store.myshopify.com (sans https://)');
      console.log('   2. Le token doit commencer par shpat_');
      console.log('   3. L\'app Custom est bien installée');
      process.exit(1);
    }
  })
  .then(async (res) => {
    const data = await res.json();
    
    if (res.ok) {
      console.log('✅ Accès aux Draft Orders OK !');
      console.log('   Nombre:', data.draft_orders ? data.draft_orders.length : 0);
      console.log('');
      console.log('🎉 Shopify API fonctionne correctement !');
      console.log('💡 Vous pouvez créer des Draft Orders.');
      console.log('');
      console.log('🔧 Prochaine étape :');
      console.log('   Testez : node test-draft-order.js');
      process.exit(0);
    } else {
      console.log('❌ ERREUR ! Accès aux Draft Orders refusé !');
      console.log('   Status:', res.status, res.statusText);
      console.log('   Réponse:', JSON.stringify(data, null, 2));
      console.log('');
      console.log('💡 Causes possibles :');
      console.log('   1. Permissions insuffisantes');
      console.log('   2. Les scopes write_draft_orders et read_draft_orders ne sont pas activés');
      console.log('');
      console.log('🔧 Solution :');
      console.log('   1. Shopify Admin → Settings → Apps → Develop apps');
      console.log('   2. Cliquez sur "Configurateur Massacre"');
      console.log('   3. Configuration → Admin API scopes');
      console.log('   4. Cochez : read_draft_orders et write_draft_orders');
      console.log('   5. Save puis réinstallez l\'app');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.log('❌ ERREUR DE CONNEXION !');
    console.log('');
    console.log('Message:', err.message);
    console.log('');
    console.log('💡 Causes possibles :');
    console.log('   1. Problème de réseau');
    console.log('   2. Domaine Shopify incorrect');
    console.log('   3. Firewall bloquant la connexion');
    process.exit(1);
  });
