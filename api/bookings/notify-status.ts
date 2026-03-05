import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendEmail } from '../_lib/helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { clientName, clientEmail, serviceName, date, time, status } = req.body;

    const isAccepted = status === 'ACCEPTED';
    const subject = isAccepted
        ? 'Appointment Confirmed! - The Hair Gallery'
        : 'Appointment Update - The Hair Gallery';

    const message = isAccepted
        ? `<p>Great news ${clientName}!</p><p>Your appointment for <strong>${serviceName}</strong> on <strong>${date}</strong> at <strong>${time}</strong> has been <strong>ACCEPTED</strong>.</p><p>We look forward to seeing you!</p>`
        : `<p>Hello ${clientName},</p><p>We're sorry, but your appointment request for <strong>${serviceName}</strong> on <strong>${date}</strong> at <strong>${time}</strong> could not be accepted at this time.</p>`;

    await sendEmail(clientEmail, subject, message);

    return res.status(200).json({ success: true });
}
