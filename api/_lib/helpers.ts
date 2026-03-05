import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_dev_only';
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'nwagwu2ebere@gmail.com';

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not configured. Email not sent.');
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@thehairgallery.com',
    to,
    subject,
    html,
  });
};

// Middleware: extract and verify JWT from Authorization header
export const requireAuth = (req: VercelRequest, res: VercelResponse): boolean => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Unauthorized' });
    return false;
  }

  try {
    (req as any).user = jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    res.status(403).json({ message: 'Forbidden' });
    return false;
  }
};
