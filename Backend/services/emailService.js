// Email service for sending emails using Brevo (formerly Sendinblue)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Brevo = require('@getbrevo/brevo');

let apiInstance = null;

/**
 * Initialize Brevo email service
 * Call this on application startup
 */
export const initializeEmailService = () => {
  try {
    // Check for required environment variables
    if (!process.env.BREVO_API_KEY) {
      console.warn('Brevo API key is not set. Email sending will be disabled.');
      console.log('Required environment variable: BREVO_API_KEY');
      return false;
    }

    // Configure API key authorization
    const defaultClient = Brevo.ApiClient.instance;
    const apiKey = defaultClient.authentications['api-key'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    // Create API instance for sending transactional emails
    apiInstance = new Brevo.TransactionalEmailsApi();
    
    console.log('Brevo email service initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Brevo email service:', error);
    return false;
  }
};

/**
 * Send an email using Brevo
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise<boolean>} - Success status
 */
export const sendEmail = async (to, subject, text, html = null) => {
  try {
    // If API instance is not initialized
    if (!apiInstance) {
      console.warn('Brevo email service not initialized. Attempting to initialize...');
      const initialized = initializeEmailService();
      if (!initialized) {
        console.error('Failed to send email: Brevo email service not initialized');
        return false;
      }
    }

    // Configure the sender
    const sender = {
      email: process.env.EMAIL_FROM || 'noreply@yourapp.com',
      name: process.env.EMAIL_FROM_NAME || 'Your App'
    };

    // Configure the recipient
    const toEmail = {
      email: to
    };

    // Create the send email object
    const sendEmailData = new Brevo.SendSmtpEmail();
    sendEmailData.sender = sender;
    sendEmailData.to = [toEmail];
    sendEmailData.subject = subject;
    sendEmailData.textContent = text;
    
    if (html) {
      sendEmailData.htmlContent = html;
    }

    // Send the email using Brevo API
    const data = await apiInstance.sendTransacEmail(sendEmailData);
    console.log(`Email sent via Brevo. Message ID: ${data.messageId}`);
    return true;
  } catch (error) {
    console.error('Failed to send email via Brevo:', error);
    return false;
  }
};

/**
 * Send a password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetToken - Password reset token
 * @param {string} resetLink - Full reset link URL
 * @returns {Promise<boolean>} - Success status
 */
export const sendPasswordResetEmail = async (to, resetToken, resetLink) => {
  const subject = 'Password Reset Request';
  const text = `
    You have requested to reset your password.
    
    Please click on the following link to reset your password:
    ${resetLink}
    
    This link will expire in 1 hour.
    
    If you did not request a password reset, please ignore this email.
  `;
  
  const html = `
    <h1>Password Reset Request</h1>
    <p>You have requested to reset your password.</p>
    <p>Please click on the button below to reset your password:</p>
    <div style="margin: 20px 0;">
      <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
        Reset Password
      </a>
    </div>
    <p>Or copy and paste this link in your browser:</p>
    <p>${resetLink}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
  `;
  
  return sendEmail(to, subject, text, html);
};

export default {
  initializeEmailService,
  sendEmail,
  sendPasswordResetEmail
}; 