/**
 * test-shopify-modern.js
 * Test avec différentes configurations d'URL Shopify
 */

require('dotenv').config();

const SHOPIFY_STORE = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN;

console.log('🧪 Test de connexion API Shopify (URLs multiples)\n');
console.log('📋 Configuration :');
console.log('   Store:', SHOPIFY_STORE);
console.log('   Token:', SHOPIFY_TOKEN ? `${SHOPIFY_TOKEN.substring(0, 12)}...` : '❌ MANQUANT');
console.log('');

// Extraire l'identifiant unique du store
const storeId = SHOPIFY_STORE.split('.')[0]; // massacre-bwh1wq9t

const urls = [
  {
    name: 'URL Standard (myshopify.com)',
    url: `https://${SHOPIFY_STORE}/admin/api/2024-10/shop.json`,
    header: 'X-Shopify-Access-Token'
  },
  {
    name: 'URL Admin Moderne',
    url: `https://admin.shopify.com/store/${storeId}/admin/api/2024-10/shop.json`,
    header: 'X-Shopify-Access-Token'
  },
  {
    name: 'URL avec API Version 2024-07',
    url: `https://${SHOPIFY_STORE}/admin/api/2024-07/shop.json`,
    header: 'X-Shopify-Access-Token'
  },
  {
    name: 'URL avec API Version 2024-04',
    url: `https://${SHOPIFY_STORE}/admin/api/2024-04/shop.json`,
    header: 'X-Shopify-Access-Token'
  }
];

async function testUrl(config, index) {
  console.log(`\n📤 Test ${index + 1}/${urls.length} : ${config.name}`);
  console.log(`   URL: ${config.url}`);
  
  try {
    const res = await fetch(config.url, {
      method: 'GET',
      headers: {
        [config.header]: SHOPIFY_TOKEN,
        'Content-Type': 'application/json'
      },
    });
    
    const data = await res.json();
    
    if (res.ok && data.shop) {
      console.log(`\n✅✅✅ SUCCÈS ! Cette URL fonctionne ! ✅✅✅`);
      console.log(`\n📋 Informations du store :`);
      console.log(`   Nom: ${data.shop.name}`);
      console.log(`   Email: ${data.shop.email}`);
      console.log(`   Domaine: ${data.shop.myshopify_domain}`);
      console.log(`\n🎉 Utilisez cette URL dans votre code !`);
      console.log(`\n📝 Configuration à utiliser :`);
      console.log(`   URL: ${config.url.replace('/shop.json', '')}`);
      console.log(`   Header: ${config.header}`);
      return true;
    } else {
      console.log(`   ❌ Échec - Status: ${res.status} ${res.statusText}`);
      if (res.status === 401) {
        console.log(`   💡 Token invalide ou permissions insuffisantes`);
      } else if (res.status === 404) {
        console.log(`   💡 Store ou endpoint non trouvé`);
      }
      return false;
    }
  } catch (err) {
    console.log(`   ❌ Erreur: ${err.message}`);
    return false;
  }
}

async function runTests() {
  let success = false;
  
  for (let i = 0; i < urls.length; i++) {
    const result = await testUrl(urls[i], i);
    if (result) {
      success = true;
      break;
    }
  }
  
  if (!success) {
    console.log(`\n\n❌ Aucune URL n'a fonctionné !`);
    console.log(`\n💡 Causes possibles :`);
    console.log(`   1. Le token est invalide`);
    console.log(`   2. L'app n'est pas correctement installée`);
    console.log(`   3. Les permissions sont insuffisantes`);
    console.log(`   4. Le store est un type spécial (Partner, Development, etc.)`);
    console.log(`\n🔧 Solutions :`);
    console.log(`   1. Vérifiez que l'app "Configurateur Massacre" est installée`);
    console.log(`   2. Vérifiez les permissions : read_draft_orders, write_draft_orders`);
    console.log(`   3. Essayez de régénérer le token (uninstall/reinstall)`);
    console.log(`   4. Contactez le support Shopify si le problème persiste`);
    process.exit(1);
  }
  
  process.exit(0);
}

runTests();
