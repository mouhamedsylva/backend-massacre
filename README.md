# 📦 Microservice de Transit - Massacre Officiel

Ce microservice Node.js / Express sert de passerelle (transit) sécurisée entre le configurateur de produits 3D/2D du frontend Shopify et les APIs de **Cloudinary** (pour le stockage d'images) et **Shopify Admin** (pour la gestion des commandes).

---

## 🚀 Rôle du Microservice

Lorsqu'un client termine sa personnalisation sur le site et clique sur **"Envoyer ma demande de devis"** :
1. Le frontend Shopify envoie les informations du client, le nom du produit et les maquettes des différentes faces (au format DataURL Base64) à ce microservice.
2. Le microservice valide les données (middleware).
3. Il téléverse (upload) les images haute résolution base64 sur **Cloudinary** dans le dossier `maquettes/`.
4. Il récupère les URLs publiques HTTPS générées par Cloudinary.
5. Il crée une **Draft Order (Commande brouillon)** dans le back-office Shopify contenant :
   - Les informations du client.
   - Les URLs Cloudinary des maquettes stockées dans les `properties` de la ligne de produit (visibles par l'administrateur Shopify).
   - Un tag `devis-en-attente` pour filtrer facilement les demandes.
   - Un prix par défaut de `0.00` (l'administrateur Shopify pourra ajuster le prix final et envoyer la facture par e-mail).

---

## 🛠️ Stack Technique

- **Runtime** : Node.js (>= 18.0.0)
- **Framework** : Express.js
- **Sécurité** : Helmet (en-têtes HTTP sécurisés), CORS (restreint aux domaines Shopify en production), Express Rate Limit (anti-spam, max 20 requêtes / 15 min par IP)
- **Upload d'images** : Cloudinary SDK
- **Shopify API** : Shopify Admin API REST (v2026-04)
- **Développement** : Nodemon

---

## 📂 Structure du Projet

```text
microservice/
├── src/
│   ├── middlewares/
│   │   └── validate.js            # Validation du payload de demande de devis
│   ├── routes/
│   │   └── devis.js               # Route POST /submit-devis (orchestration)
│   └── services/
│       ├── cloudinary.service.js  # Téléversement d'images base64 vers Cloudinary
│       └── shopify.service.js     # Création du Draft Order via Shopify Admin API REST
├── .env.example                   # Exemple de variables d'environnement
├── server.js                      # Point d'entrée principal de l'application
├── server-mock.js                 # Serveur factice (mock) pour les tests locaux sans clés API
├── test-submit.js                 # Script utilitaire de test de soumission local
├── package.json                   # Dépendances et scripts de démarrage
└── README.md                      # Présentation et guide (ce fichier)
```

---

## ⚙️ Configuration & Variables d'environnement

Copiez le fichier `.env.example` et renommez-le en `.env` :
```bash
cp .env.example .env
```

Remplissez les variables suivantes :

| Variable | Description | Exemple |
| :--- | :--- | :--- |
| `NODE_ENV` | Mode de l'application (`development` ou `production`) | `development` |
| `PORT` | Port d'écoute du serveur | `3000` |
| `CLOUDINARY_CLOUD_NAME` | Nom de votre Cloud Cloudinary | `mon_cloud_name` |
| `CLOUDINARY_API_KEY` | Clé d'API Cloudinary | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Secret d'API Cloudinary | `shhh_api_secret` |
| `SHOPIFY_STORE_DOMAIN` | Nom de domaine du store Shopify (sans `https://`) | `massacre-officiel.myshopify.com` |
| `SHOPIFY_ADMIN_API_TOKEN` | Token d'accès de votre application personnalisée (Admin API Access Token) | `shpat_xxxxxxxxxxxxxxxxxxxxxxxx` |

> [!IMPORTANT]
> **Permissions Shopify nécessaires** : Pour que la création de commandes fonctionne, le token d'accès Shopify (`SHOPIFY_ADMIN_API_TOKEN`) doit posséder les droits d'écriture et de lecture sur les commandes brouillons (`write_draft_orders`, `read_draft_orders`).

---

## 🛠️ Démarrage Local

### 1. Installation des dépendances
```bash
npm install
```

### 2. Démarrage en mode développement (avec rechargement automatique)
```bash
npm run dev
```
Le serveur démarrera sur `http://localhost:3000`.

### 3. Démarrage en production
```bash
npm start
```

---

## 🎭 Mode Test / Mock (Sans Clés API)

Si vous n'avez pas de clés API Cloudinary ou Shopify configurées mais que vous souhaitez tester l'intégration avec le frontend, lancez le serveur mock :

```bash
node server-mock.js
```

- **URL locale** : `http://localhost:3000`
- **Comportement** : Il simule un temps d'attente d'upload, génère des adresses d'images fictives Cloudinary et renvoie un faux numéro de Draft Order Shopify avec un succès de 100 %.
- **Test avec la page hors ligne** : Vous pouvez tester le configurateur en ouvrant le fichier local [`theme-shopify/test-configurateur-offline.html`](file:///c:/Users/simplon/Documents/Amadou/projet-massacre/theme-shopify/test-configurateur-offline.html) dans votre navigateur.

---

## 📡 Endpoints de l'API

### 1. Health Check
* Vérifie que le service est en ligne et fonctionnel.
* **URL** : `GET /health`
* **Réponse de succès (JSON)** :
```json
{
  "status": "ok",
  "service": "massacre-microservice"
}
```

### 2. Soumission de devis
* Reçoit les designs, les upload sur Cloudinary et crée le Draft Order.
* **URL** : `POST /submit-devis`
* **Headers** : `Content-Type: application/json`
* **Payload attendu (JSON)** :
```json
{
  "customer": {
    "email": "client@exemple.com",
    "first_name": "Jean",
    "last_name": "Dupont"
  },
  "product_title": "T-Shirt Customisé - Massacre",
  "images": {
    "front": "data:image/png;base64,iVBORw0KG...",
    "back": "data:image/png;base64,iVBORw0KG..."
  }
}
```
* **Réponse de succès (JSON - HTTP 201)** :
```json
{
  "success": true,
  "message": "Votre demande de devis a bien été reçue ! Notre équipe vous contactera sous 24–48h.",
  "draft_order": {
    "id": "gid://shopify/DraftOrder/123456789",
    "name": "#D1002",
    "status": "open",
    "created_at": "2026-06-12T00:00:00Z"
  }
}
```

---

## 🔒 Sécurité & CORS

- **Rate-Limiting** : Pour éviter le spam d'envois de gros volumes d'images base64, une limite stricte de 20 requêtes par tranche de 15 minutes par adresse IP est active sur l'URL `/submit-devis`.
- **CORS** : En mode production, seules les requêtes provenant de `https://massacre-officiel.myshopify.com` et `https://massacre-officiel.com` sont autorisées. En mode développement, toutes les origines sont acceptées pour faciliter le débogage.


---

## 🧪 Tester la Création de Draft Order

Un script de test est fourni pour vérifier que votre configuration Shopify fonctionne :

```bash
# Test en local (serveur sur localhost:3000)
node test-draft-order.js

# Test en production (Railway/Heroku)
node test-draft-order.js https://votre-projet.up.railway.app/submit-devis
```

**Le script va** :
1. Envoyer une demande de test avec des images 1x1 pixel
2. Créer un Draft Order dans Shopify Admin
3. Afficher le résultat (ID, nom, statut)

**Vérifiez ensuite** dans Shopify Admin → Orders → Drafts :
- Un nouveau Draft Order doit apparaître
- Avec le tag `configurateur`
- Les URLs Cloudinary dans les propriétés du produit

---

## 📚 Documentation Complète

Pour un guide pas à pas complet de la configuration, consultez :
- **[CONFIGURATION_DRAFT_ORDERS_SHOPIFY.md](../CONFIGURATION_DRAFT_ORDERS_SHOPIFY.md)** - Guide détaillé de configuration

---

**Dernière mise à jour** : 17 juin 2026
**Statut** : ✅ Opérationnel et prêt pour la production
