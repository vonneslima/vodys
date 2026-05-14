import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  secure: env.SMTP_PORT === 465,
});

const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> => {
  if (env.NODE_ENV === 'test') return; // Skip in test environment

  try {
    await transporter.sendMail({
      from: `Vodys <${env.SMTP_FROM}>`,
      ...options,
    });
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    logger.error('Email send failed:', error);
    throw error;
  }
};

export const emailService = {
  async sendWelcome(email: string, firstName: string): Promise<void> {
    await sendEmail({
      to: email,
      subject: 'Welcome to Vodys! 🎓',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Welcome, ${firstName}!</h1>
          <p>You've successfully joined Vodys — your personal study management platform.</p>
          <p>Start organizing your studies, track your progress, and boost your productivity.</p>
          <a href="${env.CLIENT_URL}/dashboard" 
             style="background: #6366f1; color: white; padding: 12px 24px; 
                    border-radius: 6px; text-decoration: none; display: inline-block;">
            Get Started
          </a>
          <p style="color: #6b7280; margin-top: 24px;">
            The Vodys Team
          </p>
        </div>
      `,
    });
  },

  async sendPasswordReset(email: string, firstName: string, token: string): Promise<void> {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Reset your Vodys password',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Password Reset</h1>
          <p>Hi ${firstName},</p>
          <p>You requested to reset your password. Click the link below (valid for 1 hour):</p>
          <a href="${resetUrl}"
             style="background: #6366f1; color: white; padding: 12px 24px; 
                    border-radius: 6px; text-decoration: none; display: inline-block;">
            Reset Password
          </a>
          <p style="color: #6b7280; margin-top: 24px; font-size: 14px;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  },

  async sendTaskReminder(email: string, firstName: string, taskTitle: string, dueDate: Date): Promise<void> {
    await sendEmail({
      to: email,
      subject: `Reminder: "${taskTitle}" is due soon`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6366f1;">Task Reminder</h1>
          <p>Hi ${firstName},</p>
          <p>Your task <strong>"${taskTitle}"</strong> is due on <strong>${dueDate.toLocaleDateString()}</strong>.</p>
          <a href="${env.CLIENT_URL}/tasks"
             style="background: #6366f1; color: white; padding: 12px 24px; 
                    border-radius: 6px; text-decoration: none; display: inline-block;">
            View Task
          </a>
        </div>
      `,
    });
  },
};
