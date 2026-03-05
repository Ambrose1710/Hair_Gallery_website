import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, ADMIN_EMAIL, sendEmail } from '../_lib/helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { username, email } = req.body;

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminEmail = ADMIN_EMAIL;

    const normalizedEmail = email?.trim().toLowerCase();
    const storedEmail = adminEmail.trim().toLowerCase();

    if (username !== adminUsername || normalizedEmail !== storedEmail) {
        return res.status(401).json({ message: 'The email provided does not match our records for this username.' });
    }

    // Generate a JWT-based reset token (expires in 1 hour, no file storage needed)
    const resetToken = jwt.sign({ username, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '1h' });

    await sendEmail(
        adminEmail,
        'Password Reset Request - The Hair Gallery',
        `<p>You requested a password reset for your admin account.</p>
     <p>Your reset token is: <strong>${resetToken}</strong></p>
     <p>This token will expire in 1 hour. Paste it into the reset token field on the website.</p>`
    );

    return res.status(200).json({
        message: 'Reset token generated and sent to your email.',
    });
}
