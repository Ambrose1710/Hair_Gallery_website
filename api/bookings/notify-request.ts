import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ADMIN_EMAIL, sendEmail } from '../_lib/helpers';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { clientName, clientEmail, serviceName, date, time } = req.body;

    const adminEmail = ADMIN_EMAIL;

    // Notify Client
    await sendEmail(
        clientEmail,
        'Appointment Request Received - The Hair Gallery',
        `<p>Hello ${clientName},</p>
     <p>We've received your appointment request for <strong>${serviceName}</strong> on <strong>${date}</strong> at <strong>${time}</strong>.</p>
     <p>Please wait for our confirmation email once we've reviewed your request.</p>`
    );

    // Notify Admin
    await sendEmail(
        adminEmail,
        'New Appointment Request',
        `<p>New request from <strong>${clientName}</strong> (${clientEmail})</p>
     <p>Service: ${serviceName}</p>
     <p>Time: ${date} at ${time}</p>`
    );

    return res.status(200).json({ success: true });
}
