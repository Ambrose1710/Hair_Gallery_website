import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { username } = req.body;
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';

    if (username === adminUsername) {
        return res.status(200).json({ valid: true });
    }

    return res.status(404).json({ message: 'Username not found' });
}
