import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import { sendTestEmail, sendEmailWithTemplate } from '@/lib/emailService';

interface ApiResponse {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  // Verificar que el usuario esté autenticado y sea administrador
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No autorizado. Solo administradores pueden enviar emails de prueba.'
    });
  }

  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Método no permitido'
    });
  }

  try {
    const { testType, email, templateId } = req.body;

    // Validar que se proporcionó un email
    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un email válido'
      });
    }

    let result;

    if (testType === 'template' && templateId) {
      // Enviar email de prueba usando una plantilla específica
      result = await sendEmailWithTemplate(email, templateId, {
        name: 'Administrador de Prueba',
        reward_name: 'Producto de Prueba',
        points_spent: 100,
        remaining_points: 900,
        codigo_barras: 'TEST123456',
        expiration_date: '31 de diciembre de 2025',
        date: new Date().toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
        redemption_id: '99999',
      });
    } else {
      // Enviar email de prueba genérico
      result = await sendTestEmail(email);
    }

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Email de prueba enviado correctamente a ${email}`,
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el email de prueba',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error al procesar solicitud de email de prueba:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al procesar la solicitud',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
}

export default withAuth(handler);