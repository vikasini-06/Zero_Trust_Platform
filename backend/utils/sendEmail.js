const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Send email utility using Nodemailer
 * In development or when SMTP is unavailable, it gracefully logs the message
 * so that tests and local development never fail.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const isSmtpConfigured =
      process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_USER !== 'test_smtp_user';

    if (!isSmtpConfigured) {
      logger.info(`[Email Service (Dev Simulation)] To: ${to} | Subject: "${subject}"`);
      logger.info(`[Email Content Preview]: ${text || html}`);
      return { success: true, simulated: true };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"ZeroTrust Enterprise Security" <${process.env.SMTP_FROM || 'security@zerotrust.io'}>`,
      to,
      subject,
      text,
      html,
    });

    logger.info(`[Email Service] Message sent successfully: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.warn(`[Email Service] SMTP transmission failed (${err.message}). Logging to console instead.`);
    logger.info(`[Email Content for ${to}]: ${text || html}`);
    return { success: false, error: err.message };
  }
};

module.exports = sendEmail;
