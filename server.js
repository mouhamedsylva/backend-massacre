require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const devisRouter = require("./src/routes/devis");
const zonesRouter = require("./src/routes/zones");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Configuration Railway/Proxy ──────────────────────────────────────────────
// Railway utilise un proxy inverse, on doit faire confiance aux headers X-Forwarded-*
app.set('trust proxy', true);

// ─── Sécurité ────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://cdn.shopify.com", "https://res.cloudinary.com"],
    }
  }
}));

// ─── CORS Configuration ──────────────────────────────────────────────────────
// Autoriser les requêtes depuis votre store Shopify et localhost pour tests
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (Postman, tests serveur, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Liste des domaines autorisés
    const allowedDomains = [
      'massacre-bxh1wqn9.myshopify.com',
      'massacre-officiel.com',
      'localhost',
      '127.0.0.1'
    ];
    
    // Vérifier si l'origin contient un des domaines autorisés
    const isAllowed = allowedDomains.some(domain => origin.includes(domain));
    
    if (isAllowed || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`[CORS] Origine bloquée : ${origin}`);
      callback(new Error(`Origine CORS non autorisée : ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
// Max 20 soumissions par IP toutes les 15 minutes (anti-spam)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Trop de requêtes. Veuillez patienter quelques minutes.",
  },
});
app.use("/submit-devis", limiter);

// ─── Parsing ──────────────────────────────────────────────────────────────────
// Augmenter la limite pour recevoir les images en base64 (chaque vue peut peser ~2–3 Mo)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ─── Servir l'éditeur de zones ────────────────────────────────────────────────
app.use(express.static(__dirname, { index: false }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/", devisRouter);
app.use("/api/zones", zonesRouter);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "massacre-microservice" });
});

// ─── Gestion des erreurs globales ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[Erreur globale]", err.message);
  res.status(500).json({ error: "Erreur interne du serveur." });
});

// ─── Démarrage ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Microservice Massacre démarré sur le port ${PORT}`);
  console.log(`   Environnement : ${process.env.NODE_ENV || "development"}`);
});