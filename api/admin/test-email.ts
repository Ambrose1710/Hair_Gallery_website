import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth, ADMIN_EMAIL, sendEmail } from '../_lib/helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!requireAuth(req, res)) return;

    try {
        await sendEmail(
            ADMIN_EMAIL,
            'Test Email - The Hair Gallery',
            '<p>This is a test email to verify your SMTP configuration. If you\'re reading this, it works!</p>'
        );
        return res.status(200).json({ message: 'Test email sent successfully to ' + ADMIN_EMAIL });
    } catch (err) {
        return res.status(500).json({ message: 'Failed to send test email.' });
    }
}
