/**
 * email.service.js
 * Service d'envoi d'emails via SendGrid
 */

const sgMail = require('@sendgrid/mail');

// Configuration SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@massacre-officiel.com';
const EMAIL_ADMIN = process.env.EMAIL_ADMIN || 'admin@massacre-officiel.com';

/**
 * Email de confirmation au client
 */
async function sendCustomerConfirmation({ customer, product_title, imageUrls, draftOrder }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[Email] ⚠️ SendGrid non configuré, email client non envoyé');
    return false;
  }

  const msg = {
    to: customer.email,
    from: EMAIL_FROM,
    subject: '✅ Votre demande de personnalisation a été reçue !',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0 0 10px 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; }
          .product { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .images { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .image-box { text-align: center; background: white; padding: 10px; border-radius: 8px; }
          .image-box img { max-width: 100%; height: 150px; object-fit: cover; border-radius: 6px; border: 2px solid #e0e0e0; }
          .image-box small { display: block; margin-top: 8px; color: #666; font-weight: 600; }
          .info-box { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #667eea; }
          .footer { text-align: center; color: #999; margin-top: 30px; padding: 20px; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Demande Reçue !</h1>
            <p style="margin: 0; font-size: 16px;">Merci ${customer.first_name} pour votre demande de personnalisation</p>
          </div>
          
          <div class="content">
            <p style="font-size: 16px;">Bonjour <strong>${customer.first_name} ${customer.last_name}</strong>,</p>
            
            <p>Nous avons bien reçu votre demande de personnalisation pour :</p>
            
            <div class="product">
              <h3 style="margin-top: 0; color: #667eea;">📦 ${product_title}</h3>
              ${customer.message ? `<p style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin: 10px 0;"><strong>Votre message :</strong><br>"${customer.message}"</p>` : ''}
            </div>
            
            <p>Notre équipe va étudier votre design et vous reviendra avec un <strong style="color: #667eea;">devis détaillé sous 24 à 48 heures</strong>.</p>
            
            <h3 style="color: #333; margin-top: 25px;">🎨 Votre Design :</h3>
            <div class="images">
              ${imageUrls.front ? `<div class="image-box"><img src="${imageUrls.front}" alt="Face"><small>Face</small></div>` : ''}
              ${imageUrls.back ? `<div class="image-box"><img src="${imageUrls.back}" alt="Dos"><small>Dos</small></div>` : ''}
              ${imageUrls.left ? `<div class="image-box"><img src="${imageUrls.left}" alt="Gauche"><small>Gauche</small></div>` : ''}
              ${imageUrls.right ? `<div class="image-box"><img src="${imageUrls.right}" alt="Droite"><small>Droite</small></div>` : ''}
            </div>
            
            <div class="info-box">
              <h3 style="margin-top: 0; font-size: 16px;">📋 Récapitulatif de votre demande :</h3>
              <p style="margin: 5px 0;">
                <strong>Email :</strong> ${customer.email}<br>
                ${customer.phone ? `<strong>Téléphone :</strong> ${customer.phone}<br>` : ''}
                <strong>Numéro de référence :</strong> ${draftOrder.name || '#' + Date.now()}
              </p>
            </div>
            
            <p style="margin-top: 25px;">Si vous avez des questions, n'hésitez pas à nous contacter en répondant directement à cet email.</p>
            
            <p style="margin-top: 30px; font-size: 16px;">À très bientôt,<br><strong style="color: #667eea;">L'équipe Massacre</strong></p>
          </div>
          
          <div class="footer">
            <p style="margin: 0;">Cet email a été envoyé automatiquement suite à votre demande sur notre configurateur.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Bonjour ${customer.first_name} ${customer.last_name},

Nous avons bien reçu votre demande de personnalisation pour :
${product_title}

Notre équipe va étudier votre design et vous reviendra avec un devis détaillé sous 24-48h.

Récapitulatif :
- Email : ${customer.email}
${customer.phone ? `- Téléphone : ${customer.phone}` : ''}
${customer.message ? `- Message : "${customer.message}"` : ''}
- Numéro de référence : ${draftOrder.name || '#' + Date.now()}

Vos images de design :
${imageUrls.front ? `- Face : ${imageUrls.front}` : ''}
${imageUrls.back ? `- Dos : ${imageUrls.back}` : ''}
${imageUrls.left ? `- Gauche : ${imageUrls.left}` : ''}
${imageUrls.right ? `- Droite : ${imageUrls.right}` : ''}

Si vous avez des questions, répondez à cet email.

À très bientôt,
L'équipe Massacre
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`[Email] ✅ Confirmation envoyée à ${customer.email}`);
    return true;
  } catch (error) {
    console.error(`[Email] ❌ Erreur envoi client :`, error.message);
    if (error.response) {
      console.error('[Email] Détails:', error.response.body);
    }
    return false;
  }
}

/**
 * Email de notification à l'admin
 */
async function sendAdminNotification({ customer, product_title, imageUrls, draftOrder }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('[Email] ⚠️ SendGrid non configuré, email admin non envoyé');
    return false;
  }

  const msg = {
    to: EMAIL_ADMIN,
    from: EMAIL_FROM,
    subject: `🔔 Nouvelle demande - ${customer.first_name} ${customer.last_name}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #f5f5f5; }
          .header { background: #333; color: white; padding: 25px; }
          .header h2 { margin: 0; font-size: 22px; }
          .content { background: white; padding: 30px; }
          .info-box { background: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #667eea; }
          .info-box h3 { margin-top: 0; font-size: 16px; color: #667eea; }
          .images a { display: block; margin: 8px 0; color: #667eea; text-decoration: none; font-weight: 500; }
          .images a:hover { text-decoration: underline; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: 600; }
          .button:hover { background: #5568d3; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔔 Nouvelle Demande de Personnalisation</h2>
          </div>
          
          <div class="content">
            <div class="info-box">
              <h3>👤 Informations Client</h3>
              <p style="margin: 5px 0;">
                <strong>Nom :</strong> ${customer.first_name} ${customer.last_name}<br>
                <strong>Email :</strong> <a href="mailto:${customer.email}" style="color: #667eea;">${customer.email}</a><br>
                ${customer.phone ? `<strong>Téléphone :</strong> <a href="tel:${customer.phone}" style="color: #667eea;">${customer.phone}</a><br>` : ''}
              </p>
            </div>
            
            <div class="info-box">
              <h3>📦 Produit</h3>
              <p style="margin: 5px 0 10px 0;"><strong>${product_title}</strong></p>
              ${customer.message ? `<div style="background: #fff; padding: 12px; border-radius: 6px; border: 1px solid #e0e0e0;"><strong>Message du client :</strong><br>"${customer.message}"</div>` : ''}
            </div>
            
            <div class="info-box">
              <h3>🎨 Images du Design</h3>
              <div class="images">
                ${imageUrls.front ? `<a href="${imageUrls.front}" target="_blank">→ Voir la vue Face</a>` : ''}
                ${imageUrls.back ? `<a href="${imageUrls.back}" target="_blank">→ Voir la vue Dos</a>` : ''}
                ${imageUrls.left ? `<a href="${imageUrls.left}" target="_blank">→ Voir la vue Gauche</a>` : ''}
                ${imageUrls.right ? `<a href="${imageUrls.right}" target="_blank">→ Voir la vue Droite</a>` : ''}
              </div>
            </div>
            
            <div class="info-box">
              <h3>📋 Draft Order Shopify</h3>
              <p style="margin: 5px 0;">
                <strong>Numéro :</strong> ${draftOrder.name || 'N/A'}<br>
                ${draftOrder.id ? `<strong>ID :</strong> ${draftOrder.id.split('/').pop()}<br>` : ''}
                ${draftOrder.createdAt ? `<strong>Créé le :</strong> ${new Date(draftOrder.createdAt).toLocaleString('fr-FR')}<br>` : ''}
              </p>
              ${draftOrder.invoiceUrl ? `<a href="${draftOrder.invoiceUrl}" class="button" target="_blank">Voir dans Shopify →</a>` : ''}
            </div>
            
            <p style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin-top: 20px;">
              <strong>⏰ Action requise :</strong> Préparer le devis et contacter le client sous 24-48h.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
🔔 Nouvelle Demande de Personnalisation

Client :
- Nom : ${customer.first_name} ${customer.last_name}
- Email : ${customer.email}
${customer.phone ? `- Téléphone : ${customer.phone}` : ''}

Produit : ${product_title}

${customer.message ? `Message du client : "${customer.message}"` : ''}

Images du design :
${imageUrls.front ? `- Face : ${imageUrls.front}` : ''}
${imageUrls.back ? `- Dos : ${imageUrls.back}` : ''}
${imageUrls.left ? `- Gauche : ${imageUrls.left}` : ''}
${imageUrls.right ? `- Droite : ${imageUrls.right}` : ''}

Draft Order : ${draftOrder.name || 'N/A'}
${draftOrder.id ? `ID : ${draftOrder.id}` : ''}

Action requise : Contacter le client sous 24-48h.
    `
  };

  try {
    await sgMail.send(msg);
    console.log(`[Email] ✅ Notification admin envoyée à ${EMAIL_ADMIN}`);
    return true;
  } catch (error) {
    console.error(`[Email] ❌ Erreur envoi admin :`, error.message);
    if (error.response) {
      console.error('[Email] Détails:', error.response.body);
    }
    // Ne pas bloquer si l'email admin échoue
    return false;
  }
}

module.exports = {
  sendCustomerConfirmation,
  sendAdminNotification
};
