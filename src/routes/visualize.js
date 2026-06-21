/**
 * visualize.js
 * Route pour afficher les maquettes d'un Draft Order
 * 
 * GET /visualize/:sessionId
 */

const express = require('express');
const router = express.Router();

/**
 * Stockage temporaire des sessions en mémoire
 * En production, utiliser une base de données (Redis, MongoDB, etc.)
 */
const sessions = new Map();

/**
 * Enregistre une session avec les URLs des images
 */
function saveSession(sessionId, imageUrls, customerInfo) {
  sessions.set(sessionId, {
    imageUrls,
    customerInfo,
    createdAt: new Date()
  });
}

/**
 * GET /visualize/:sessionId
 * Affiche une page HTML avec toutes les maquettes
 */
router.get('/visualize/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  const session = sessions.get(sessionId);
  
  if (!session) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Session introuvable</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .error-box {
            background: white;
            padding: 40px;
            border-radius: 12px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
          }
          h1 { color: #e53e3e; margin-bottom: 10px; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>❌ Session introuvable</h1>
          <p>Cette page de visualisation n'existe pas ou a expiré.</p>
          <p>Session ID: <code>${sessionId}</code></p>
        </div>
      </body>
      </html>
    `);
  }
  
  const { imageUrls, customerInfo } = session;
  const views = ['front', 'back', 'left', 'right'];
  const viewLabels = {
    front: 'Face avant',
    back: 'Face arrière',
    left: 'Côté gauche',
    right: 'Côté droit'
  };
  
  res.send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Maquettes - ${customerInfo.first_name} ${customerInfo.last_name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 1400px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 3px solid #667eea;
        }
        h1 {
          color: #333;
          font-size: 32px;
          margin-bottom: 10px;
        }
        .customer-info {
          color: #666;
          font-size: 16px;
        }
        .session-id {
          display: inline-block;
          background: #f0f4ff;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          color: #667eea;
          font-weight: 600;
          margin-top: 10px;
        }
        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
        }
        .image-card {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .image-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .image-card h2 {
          color: #667eea;
          font-size: 18px;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e0e0e0;
        }
        .image-wrapper {
          position: relative;
          width: 100%;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .image-wrapper img {
          width: 100%;
          height: auto;
          display: block;
        }
        .download-btn {
          display: block;
          width: 100%;
          margin-top: 15px;
          padding: 10px;
          background: #667eea;
          color: white;
          text-align: center;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 600;
          transition: background 0.2s;
        }
        .download-btn:hover {
          background: #5a67d8;
        }
        .no-image {
          text-align: center;
          padding: 40px;
          color: #999;
          font-style: italic;
        }
        .footer {
          text-align: center;
          padding-top: 30px;
          border-top: 2px solid #e0e0e0;
          color: #999;
          font-size: 14px;
        }
        .print-btn {
          display: inline-block;
          padding: 12px 24px;
          background: #48bb78;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 20px;
          text-decoration: none;
        }
        .print-btn:hover {
          background: #38a169;
        }
        @media print {
          body { background: white; padding: 0; }
          .container { box-shadow: none; }
          .print-btn { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header>
          <h1>📸 Maquettes de personnalisation</h1>
          <div class="customer-info">
            Client : <strong>${customerInfo.first_name} ${customerInfo.last_name}</strong>
          </div>
          <div class="session-id">Session: ${sessionId}</div>
        </header>
        
        <button class="print-btn" onclick="window.print()">🖨️ Imprimer cette page</button>
        
        <div class="images-grid">
          ${views.map(view => {
            if (imageUrls[view]) {
              return `
                <div class="image-card">
                  <h2>🎨 ${viewLabels[view]}</h2>
                  <div class="image-wrapper">
                    <img src="${imageUrls[view]}" alt="${viewLabels[view]}" loading="lazy">
                  </div>
                  <a href="${imageUrls[view]}" class="download-btn" download="${sessionId}_${view}.png" target="_blank">
                    📥 Télécharger en HD
                  </a>
                </div>
              `;
            } else {
              return `
                <div class="image-card">
                  <h2>🎨 ${viewLabels[view]}</h2>
                  <div class="no-image">
                    Aucune maquette pour cette vue
                  </div>
                </div>
              `;
            }
          }).join('')}
        </div>
        
        <div class="footer">
          <p>Généré le ${new Date().toLocaleString('fr-FR')}</p>
          <p>Massacre Officiel - Configurateur de personnalisation</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

module.exports = { router, saveSession };
