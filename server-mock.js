/**
 * Serveur Mock pour Tests Sans Clés API
 * Simule les réponses de Cloudinary et Shopify
 * 
 * Usage: node server-mock.js
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // En production, restreindre aux domaines autorisés
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logger middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Health Check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'MOCK',
    message: '🎭 Serveur de test - Aucune clé API requise',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      submit: '/api/submit-design'
    }
  });
});

/**
 * Endpoint Principal : Soumission de Design
 * Simule l'upload sur Cloudinary et la création de Draft Order
 */
app.post('/api/submit-design', async (req, res) => {
  try {
    console.log('\n' + '═'.repeat(70));
    console.log('📦 NOUVELLE SOUMISSION REÇUE (MODE MOCK)');
    console.log('═'.repeat(70));
    
    const { customer, product, views } = req.body;
    
    // Validation basique
    if (!customer || !customer.email) {
      return res.status(400).json({
        success: false,
        message: 'Email client requis'
      });
    }
    
    if (!product || !product.id) {
      return res.status(400).json({
        success: false,
        message: 'Informations produit requises'
      });
    }
    
    // Log des informations client
    console.log('\n👤 CLIENT:');
    console.log(`   Prénom: ${customer.first_name || 'N/A'}`);
    console.log(`   Nom: ${customer.last_name || 'N/A'}`);
    console.log(`   Email: ${customer.email}`);
    
    // Log du produit
    console.log('\n📦 PRODUIT:');
    console.log(`   ID: ${product.id}`);
    console.log(`   Titre: ${product.title || 'N/A'}`);
    
    // Log des vues (taille des images)
    console.log('\n🖼️  VUES GÉNÉRÉES:');
    const viewSizes = {};
    Object.keys(views).forEach(viewName => {
      if (views[viewName]) {
        const sizeKB = (views[viewName].length / 1024).toFixed(2);
        viewSizes[viewName] = `${sizeKB} KB`;
        console.log(`   ${viewName.padEnd(6)}: ${sizeKB} KB`);
      }
    });
    
    // Simuler un délai d'upload sur Cloudinary (1-2 secondes)
    console.log('\n⏳ Simulation upload Cloudinary...');
    await simulateDelay(1000, 2000);
    console.log('✅ Upload simulé terminé');
    
    // Générer des URLs mockées pour Cloudinary
    const mockImageUrls = {};
    Object.keys(views).forEach(viewName => {
      if (views[viewName]) {
        mockImageUrls[viewName] = `https://res.cloudinary.com/mock/image/upload/v${Date.now()}/${product.id}_${viewName}.png`;
      }
    });
    
    // Simuler la création d'une Draft Order
    console.log('\n⏳ Simulation création Draft Order Shopify...');
    await simulateDelay(500, 1000);
    
    const mockDraftOrderId = generateMockId();
    const mockDraftOrderNumber = Math.floor(Math.random() * 90000) + 10000;
    
    console.log('✅ Draft Order simulée créée');
    console.log(`   ID: ${mockDraftOrderId}`);
    console.log(`   Numéro: #${mockDraftOrderNumber}`);
    
    // Préparer la réponse
    const response = {
      success: true,
      message: '✅ Demande de devis créée avec succès',
      mode: 'MOCK',
      data: {
        draftOrder: {
          id: mockDraftOrderId,
          number: mockDraftOrderNumber,
          name: `#D${mockDraftOrderNumber}`,
          status: 'open',
          createdAt: new Date().toISOString()
        },
        customer: {
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          fullName: `${customer.first_name} ${customer.last_name}`
        },
        product: {
          id: product.id,
          title: product.title
        },
        images: mockImageUrls,
        imageSizes: viewSizes,
        shopifyAdminUrl: `https://votre-store.myshopify.com/admin/draft_orders/${mockDraftOrderId}`
      },
      warning: '⚠️ MODE MOCK - Les données n\'ont pas été réellement envoyées à Shopify/Cloudinary'
    };
    
    console.log('\n✅ RÉPONSE ENVOYÉE AU CLIENT');
    console.log('═'.repeat(70) + '\n');
    
    // Réponse au client
    res.status(200).json(response);
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement de la demande',
      error: error.message,
      mode: 'MOCK'
    });
  }
});

/**
 * Route catch-all pour les routes non trouvées
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    availableRoutes: [
      'GET /health',
      'POST /api/submit-design'
    ]
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Simule un délai aléatoire
 */
function simulateDelay(minMs, maxMs) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Génère un ID mock qui ressemble à un ID Shopify
 */
function generateMockId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `gid://shopify/DraftOrder/${timestamp}${random}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// DÉMARRAGE DU SERVEUR
// ══════════════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.clear();
  console.log('\n' + '═'.repeat(70));
  console.log('🎭 SERVEUR MOCK DÉMARRÉ'.padStart(45));
  console.log('═'.repeat(70));
  console.log('\n📍 INFORMATIONS DU SERVEUR:');
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Mode: MOCK (Aucune clé API requise)`);
  console.log(`   Environnement: Développement\n`);
  
  console.log('✅ ENDPOINTS DISPONIBLES:');
  console.log(`   GET  /health              - Vérification de santé`);
  console.log(`   POST /api/submit-design   - Soumission de design\n`);
  
  console.log('⚠️  AVERTISSEMENT:');
  console.log('   Ce serveur simule les réponses de Cloudinary et Shopify.');
  console.log('   Les données ne sont PAS réellement envoyées aux services externes.');
  console.log('   Utilisez-le uniquement pour tester le frontend.\n');
  
  console.log('🧪 POUR TESTER:');
  console.log('   1. Ouvrir un autre terminal');
  console.log('   2. cd theme-shopify');
  console.log('   3. python -m http.server 8080');
  console.log('   4. Navigateur: http://localhost:8080/test-configurateur-offline.html\n');
  
  console.log('💡 CONSEIL:');
  console.log('   Ouvrir la console F12 dans le navigateur pour voir les requêtes.\n');
  
  console.log('─'.repeat(70));
  console.log('Appuyez sur Ctrl+C pour arrêter le serveur\n');
});

// Gestion propre de l'arrêt
process.on('SIGINT', () => {
  console.log('\n\n👋 Arrêt du serveur mock...');
  console.log('✅ Serveur arrêté proprement.\n');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Arrêt du serveur mock...');
  console.log('✅ Serveur arrêté proprement.\n');
  process.exit(0);
});
