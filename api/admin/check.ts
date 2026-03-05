import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!requireAuth(req, res)) return;

    return res.status(200).json({ authenticated: true });
}
