// Email service for sending emails
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Initialize email transporter
 * Call this on application startup
 */
export const initializeEmailService = () => {
  try {
    // Check for required environment variables
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email configuration is incomplete. Email sending will be disabled.');
      console.log('Required environment variables: EMAIL_HOST, EMAIL_USER, EMAIL_PASS');
      return false;
    }

    // Create a transporter
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    console.log('Email service initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize email service:', error);
    return false;
  }
};

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise<boolean>} - Success status
 */
export const sendEmail = async (to, subject, text, html = null) => {
  try {
    // If transporter is not initialized
    if (!transporter) {
      console.warn('Email service not initialized. Attempting to initialize...');
      const initialized = initializeEmailService();
      if (!initialized) {
        console.error('Failed to send email: Email service not initialized');
        return false;
      }
    }

    // Configure email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      text,
      ...(html && { html }),
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
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