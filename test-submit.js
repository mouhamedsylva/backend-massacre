// test-submit.js  (à la racine du microservice, jamais committé)

const { createReadStream, readFileSync } = require("fs");

// Petite image PNG 1x1 pixel en base64 (pour simuler un export canvas)
const FAKE_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const body = {
  customer: {
    email: "test@massacre-officiel.com",
    first_name: "Jean",
    last_name: "Dupont"
  },
  product_title: "T-Shirt Customisé - Massacre",
  images: {
    front: FAKE_IMAGE,
    back: FAKE_IMAGE
  }
};

fetch("http://localhost:3000/submit-devis", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body)
})
  .then(res => res.json())
  .then(data => console.log("Réponse :", JSON.stringify(data, null, 2)))
  .catch(err => console.error("Erreur :", err.message));