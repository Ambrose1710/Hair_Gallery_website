import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWT_SECRET } from '../_lib/helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and new password are required.' });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as any;

        if (payload.purpose !== 'password-reset') {
            return res.status(400).json({ message: 'Invalid reset token.' });
        }

        // Generate the new hash
        const newHash = bcrypt.hashSync(newPassword, 10);

        // Because Vercel can't write to env vars at runtime, we return the new hash
        // so the admin can paste it into the Vercel dashboard as ADMIN_PASSWORD_HASH
        return res.status(200).json({
            message: 'Token verified! Copy the hash below and update ADMIN_PASSWORD_HASH in your Vercel environment variables to complete the password reset.',
            newHash,
        });

    } catch (err) {
        return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }
}
