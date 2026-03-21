import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

type Data = {
  success: boolean;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { name, email, phone, message } = req.body;

  if (!name || !email || !phone || !message) {
    return res.status(400).json({ success: false, message: 'Faltan campos requeridos' });
  }

  try {
    // Configurar el transporte de correo usando variables de entorno
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '465'),
      secure: process.env.EMAIL_SECURE === 'true', // true para 465, false para otros puertos
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Enviar el correo
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      subject: `Solicitud de Ayuda - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #166534; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">Nueva Solicitud de Ayuda</h2>
          
          <div style="margin: 20px 0;">
            <p><strong>Nombre:</strong> ${name}</p>
            <p><strong>Correo Electrónico:</strong> ${email}</p>
            <p><strong>Teléfono:</strong> ${phone}</p>
          </div>
          
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h3 style="color: #166534; margin-top: 0;">Mensaje:</h3>
            <p style="white-space: pre-line;">${message}</p>
          </div>
          
          <p style="font-size: 12px; color: #6b7280; text-align: center; margin-top: 30px;">
            Este mensaje fue enviado desde el formulario de ayuda de Club ViveVerde.
          </p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: 'Correo enviado correctamente' });
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    return res.status(500).json({ success: false, message: 'Error al enviar el correo' });
  }
}
