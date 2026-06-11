require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const devisRouter = require("./src/routes/devis");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Sécurité ────────────────────────────────────────────────────────────────
app.use(helmet());

// Autoriser uniquement le domaine Shopify en production
const allowedOrigins = [
  "https://massacre-officiel.myshopify.com",
  "https://massacre-officiel.com",
  // En développement local, autoriser toutes les origines
  ...(process.env.NODE_ENV !== "production" ? ["http://localhost:*"] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Autoriser les requêtes sans origin (ex: Postman, tests)
      if (!origin || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      if (allowedOrigins.some((o) => origin.startsWith(o.replace("*", "")))) {
        callback(null, true);
      } else {
        callback(new Error(`Origine CORS non autorisée : ${origin}`));
      }
    },
    methods: ["POST"],
    allowedHeaders: ["Content-Type"],
  })
);

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

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/", devisRouter);

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