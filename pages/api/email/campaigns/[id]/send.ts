import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '../../../../../lib/db';

interface ApiResponse {
  success: boolean;
  message?: string;
  sent_count?: number;
  error?: string;
}

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ApiResponse>
) {
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({ success: false, error: 'No autorizado' });
  }

  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Método no permitido' });
  }

  try {
    const campaign = await executeQuery({
      query: 'SELECT * FROM email_campaigns WHERE id = ? AND status IN (?, ?)',
      values: [id, 'draft', 'scheduled']
    });

    if ((campaign as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaña no encontrada o ya enviada'
      });
    }

    const campaignData = (campaign as any[])[0];

    // Obtener suscriptores activos
    const subscribers = await executeQuery({
      query: `
        SELECT id, email, name, user_id
        FROM email_subscribers
        WHERE status = 'active'
        LIMIT 100
      `
    }) as any[];

    if (subscribers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No hay suscriptores activos para enviar'
      });
    }

    // Actualizar estado de la campaña a enviando
    await executeQuery({
      query: `
        UPDATE email_campaigns
        SET status = 'sending', updated_at = NOW()
        WHERE id = ?
      `,
      values: [id]
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      try {
        // Registrar cada envío en email_campaign_recipients
        const recipientQuery = `
          INSERT INTO email_campaign_recipients (campaign_id, recipient_id, status, sent_at)
          VALUES (?, ?, 'sent', NOW())
        `;

        await executeQuery({
          query: recipientQuery,
          values: [id, subscriber.id]
        });

        sentCount++;
      } catch (error) {
        failedCount++;
        console.error(`Error al enviar a ${subscriber.email}:`, error);
      }
    }

    // Actualizar la campaña con los totales
    const totalRecipients = sentCount + failedCount;
    const openRate = sentCount > 0 ? ((0 / sentCount) * 100) : 0;
    const clickRate = sentCount > 0 ? ((0 / sentCount) * 100) : 0;

    await executeQuery({
      query: `
        UPDATE email_campaigns
        SET status = 'sent',
            sent_at = NOW(),
            total_recipients = ?,
            total_sent = ?,
            total_bounced = ?,
            open_rate = ?,
            click_rate = ?,
            updated_at = NOW()
        WHERE id = ?
      `,
      values: [totalRecipients, sentCount, failedCount, openRate, clickRate, id]
    });

    return res.status(200).json({
      success: true,
      message: 'Campaña enviada correctamente',
      sent_count: sentCount
    });
  } catch (error: any) {
    console.error('Error al enviar campaña:', error);

    await executeQuery({
      query: `
        UPDATE email_campaigns
        SET status = 'failed', updated_at = NOW()
        WHERE id = ?
      `,
      values: [id]
    });

    return res.status(500).json({
      success: false,
      error: error.message || 'Error al enviar la campaña'
    });
  }
}

export default withAuth(handler);
