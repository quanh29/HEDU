import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class SMTPConfig {
  constructor() {
    this.transporter = null;
  }

  createTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for 587
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('✅ SMTP Transporter created');
    }
    return this.transporter;
  }

  async verifyConnection() {
    try {
      const transporter = this.createTransporter();
      await transporter.verify();
      console.log('✅ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);
      return false;
    }
  }

  getTransporter() {
    return this.transporter || this.createTransporter();
  }
}

const smtpConfig = new SMTPConfig();
export default smtpConfig;
