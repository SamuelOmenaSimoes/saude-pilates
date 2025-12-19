/**
 * Email helper for sending password reset emails using SendGrid
 * 
 * Requires environment variables:
 * - SENDGRID_API_KEY: Your SendGrid API key
 * - SENDGRID_FROM_EMAIL: Verified sender email (e.g., noreply@yourdomain.com)
 */

import sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Initialize SendGrid with API key
 */
function initSendGrid() {
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.warn('[EMAIL] SENDGRID_API_KEY not configured. Emails will be logged to console only.');
    return false;
  }
  
  sgMail.setApiKey(apiKey);
  return true;
}

/**
 * Send an email using SendGrid
 * Falls back to console logging if SendGrid is not configured
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const isConfigured = initSendGrid();
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@saudeepilates.com';
  
  if (!isConfigured) {
    // Fallback: log to console
    console.log('='.repeat(80));
    console.log('[EMAIL] SendGrid not configured. Email would be sent:');
    console.log(`From: ${fromEmail}`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('Body:');
    console.log(options.html);
    console.log('='.repeat(80));
    return true;
  }
  
  try {
    await sgMail.send({
      to: options.to,
      from: fromEmail,
      subject: options.subject,
      html: options.html,
    });
    
    console.log(`[EMAIL] Successfully sent email to ${options.to}`);
    return true;
  } catch (error: any) {
    console.error('[EMAIL] Failed to send email:', error.response?.body || error.message);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string,
  resetUrl: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6; 
          color: #333; 
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container { 
          max-width: 600px; 
          margin: 40px auto; 
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
          color: white; 
          padding: 40px 20px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 600;
        }
        .content { 
          padding: 40px 30px; 
          background: white; 
        }
        .content h2 {
          color: #0891b2;
          margin-top: 0;
          font-size: 24px;
        }
        .content p {
          margin: 16px 0;
          color: #555;
        }
        .button-container {
          text-align: center;
          margin: 32px 0;
        }
        .button { 
          display: inline-block; 
          padding: 14px 36px; 
          background: #0891b2; 
          color: white !important; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: 600;
          font-size: 16px;
          transition: background 0.3s ease;
        }
        .button:hover {
          background: #0e7490;
        }
        .link-box {
          background: #f9fafb;
          padding: 16px;
          border-radius: 6px;
          margin: 24px 0;
          border-left: 4px solid #0891b2;
        }
        .link-box p {
          margin: 8px 0;
          word-break: break-all; 
          color: #0891b2;
          font-size: 14px;
        }
        .warning {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 16px;
          margin: 24px 0;
          border-radius: 6px;
        }
        .warning p {
          margin: 0;
          color: #92400e;
          font-weight: 500;
        }
        .footer { 
          text-align: center; 
          padding: 24px; 
          background: #f9fafb;
          color: #6b7280; 
          font-size: 13px;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          margin: 8px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧘‍♀️ Saúde e Pilates</h1>
        </div>
        <div class="content">
          <h2>Olá, ${name}!</h2>
          <p>Você solicitou a recuperação de senha da sua conta no sistema Saúde e Pilates.</p>
          <p>Para criar uma nova senha, clique no botão abaixo:</p>
          
          <div class="button-container">
            <a href="${resetUrl}" class="button">Redefinir Minha Senha</a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">Ou copie e cole este link no seu navegador:</p>
          <div class="link-box">
            <p>${resetUrl}</p>
          </div>
          
          <div class="warning">
            <p>⏰ Este link é válido por apenas 1 hora por motivos de segurança.</p>
          </div>
          
          <p style="margin-top: 32px; color: #6b7280; font-size: 14px;">
            Se você não solicitou esta recuperação de senha, pode ignorar este email com segurança. 
            Sua senha não será alterada.
          </p>
        </div>
        <div class="footer">
          <p><strong>Saúde e Pilates</strong></p>
          <p>© ${new Date().getFullYear()} Todos os direitos reservados.</p>
          <p style="margin-top: 16px; font-size: 12px;">
            Este é um email automático, por favor não responda.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail({
    to: email,
    subject: '🔐 Recuperação de Senha - Saúde e Pilates',
    html,
  });
}
