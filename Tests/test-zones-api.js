/**
 * test-zones-api.js
 * Script de test pour l'API de gestion des zones éditables
 * 
 * Usage: node Tests/test-zones-api.js
 */

require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// ID de produit de test - CHANGEZ CETTE VALEUR
const TEST_PRODUCT_ID = 'gid://shopify/Product/YOUR_PRODUCT_ID_HERE';

console.log('🧪 Test de l\'API Zones Editables\n');
console.log('Configuration:');
console.log(`  API URL: ${API_BASE_URL}`);
console.log(`  Product ID: ${TEST_PRODUCT_ID}\n`);

/**
 * Test 1: Récupération d'un produit
 */
async function testGetProduct() {
  console.log('📥 Test 1: GET /api/zones/product/:productId');
  
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/zones/product/${encodeURIComponent(TEST_PRODUCT_ID)}`
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ ÉCHEC:', data.error);
      return null;
    }
    
    console.log('✅ SUCCÈS');
    console.log('   Titre:', data.title);
    console.log('   Handle:', data.handle);
    console.log('   Images:', Object.keys(data.images).filter(k => data.images[k]).join(', '));
    console.log('   Zones existantes:', JSON.stringify(data.zones, null, 2));
    console.log('');
    
    return data;
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    return null;
  }
}

/**
 * Test 2: Sauvegarde de zones
 */
async function testSaveZones(productId) {
  console.log('💾 Test 2: POST /api/zones/save');
  
  const testZones = {
    front: [
      { x: 150, y: 200, w: 300, h: 400 },
      { x: 100, y: 100, w: 150, h: 150 }
    ],
    back: [
      { x: 120, y: 180, w: 320, h: 420 }
    ],
    left: [],
    right: []
  };
  
  console.log('   Zones à sauvegarder:', JSON.stringify(testZones, null, 2));
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/zones/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId: productId,
        zones: testZones
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ ÉCHEC:', data.error);
      if (data.details) {
        console.error('   Détails:', JSON.stringify(data.details, null, 2));
      }
      return false;
    }
    
    console.log('✅ SUCCÈS');
    console.log('   Message:', data.message);
    console.log('');
    
    return true;
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
    return false;
  }
}

/**
 * Test 3: Liste des produits
 */
async function testListProducts() {
  console.log('📋 Test 3: GET /api/zones/products');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/zones/products`);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ ÉCHEC:', data.error);
      return;
    }
    
    console.log('✅ SUCCÈS');
    console.log(`   ${data.products.length} produits trouvés`);
    
    // Afficher les 5 premiers
    data.products.slice(0, 5).forEach(product => {
      console.log(`   - ${product.title} (${product.hasZones ? '✓ avec zones' : '✗ sans zones'})`);
    });
    
    if (data.products.length > 5) {
      console.log(`   ... et ${data.products.length - 5} autres`);
    }
    console.log('');
    
  } catch (error) {
    console.error('❌ ERREUR:', error.message);
  }
}

/**
 * Test 4: Vérification après sauvegarde
 */
async function testVerifyAfterSave() {
  console.log('🔍 Test 4: Vérification des zones sauvegardées');
  
  const product = await testGetProduct();
  
  if (!product) {
    console.error('❌ Impossible de vérifier');
    return;
  }
  
  if (product.zones.front && product.zones.front.length > 0) {
    console.log('✅ Zones correctement sauvegardées');
    console.log('   Zones front:', product.zones.front.length);
    console.log('   Zones back:', product.zones.back.length);
  } else {
    console.log('⚠️  Aucune zone trouvée');
  }
  console.log('');
}

/**
 * Exécution des tests
 */
async function runTests() {
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // Vérifier que le product ID est configuré
  if (TEST_PRODUCT_ID === 'gid://shopify/Product/YOUR_PRODUCT_ID_HERE') {
    console.error('⚠️  ERREUR: Veuillez configurer TEST_PRODUCT_ID dans le script\n');
    console.log('Pour trouver votre Product ID:');
    console.log('1. Allez dans Shopify Admin > Produits');
    console.log('2. Ouvrez un produit');
    console.log('3. L\'URL contient l\'ID: /products/1234567890');
    console.log('4. Format complet: gid://shopify/Product/1234567890\n');
    process.exit(1);
  }
  
  // Test 1: Récupérer le produit
  const product = await testGetProduct();
  
  if (!product) {
    console.error('⚠️  Impossible de continuer sans produit valide\n');
    process.exit(1);
  }
  
  // Test 2: Sauvegarder des zones de test
  const saveSuccess = await testSaveZones(product.productId);
  
  if (!saveSuccess) {
    console.error('⚠️  La sauvegarde a échoué\n');
  }
  
  // Test 3: Lister tous les produits
  await testListProducts();
  
  // Test 4: Vérifier que les zones sont bien sauvegardées
  if (saveSuccess) {
    await testVerifyAfterSave();
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✨ Tests terminés\n');
}

// Lancer les tests
runTests().catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
