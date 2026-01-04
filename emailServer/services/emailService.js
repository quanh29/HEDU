import smtpConfig from '../config/smtp.config.js';
import { emailTemplates } from '../templates/emailTemplates.js';

class EmailService {
  constructor() {
    this.transporter = smtpConfig.getTransporter();
  }

  /**
   * Send email based on notification event
   * @param {Object} notification - Notification object with event_type, receiver_email, etc.
   */
  async sendNotificationEmail(notification) {
    try {
      const { event_type, receiver_email, event_title, event_message, event_url, courseTitle } = notification;

      // Get the appropriate email template
      const templateFunction = emailTemplates[event_type] || emailTemplates.other;
      const emailContent = templateFunction({
        event_title,
        event_message,
        event_url,
        courseTitle
      });

      // Email options
      const mailOptions = {
        from: {
          name: 'HEDU',
          address: process.env.SMTP_USER
        },
        to: receiver_email,
        subject: emailContent.subject,
        html: emailContent.html
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email sent successfully:', {
        messageId: info.messageId,
        to: receiver_email,
        subject: emailContent.subject
      });

      return {
        success: true,
        messageId: info.messageId,
        to: receiver_email
      };
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw error;
    }
  }

  /**
   * Send bulk emails to multiple recipients
   * @param {Array} notifications - Array of notification objects
   */
  async sendBulkEmails(notifications) {
    const results = [];
    
    for (const notification of notifications) {
      try {
        const result = await this.sendNotificationEmail(notification);
        results.push({ ...result, notification_id: notification._id });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          notification_id: notification._id,
          to: notification.receiver_email
        });
      }
    }

    return results;
  }

  /**
   * Send test email
   * @param {String} to - Recipient email address
   */
  async sendTestEmail(to) {
    try {
      const mailOptions = {
        from: {
          name: 'Learning Platform',
          address: process.env.SMTP_USER
        },
        to: to,
        subject: '🧪 Test Email from Email Server',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
              .content { background: #f9f9f9; padding: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🧪 Test Email</h1>
              </div>
              <div class="content">
                <p>This is a test email from your Email Server.</p>
                <p>If you received this, your email configuration is working correctly!</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Test email sent successfully:', {
        messageId: info.messageId,
        to: to
      });

      return {
        success: true,
        messageId: info.messageId,
        to: to
      };
    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      throw error;
    }
  }
}

const emailService = new EmailService();
export default emailService;
