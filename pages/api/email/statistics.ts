import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '../../../lib/db';

interface CampaignStats {
  id: number;
  date: string;
  campaign_id: number | null;
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_unsubscribed: number;
  open_rate: number;
  click_rate: number;
}

interface RecipientStats {
  id: number;
  campaign_id: number;
  recipient_id: number;
  status: 'pending' | 'sent' | 'failed' | 'opened' | 'clicked';
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  error_message: string | null;
}

interface ApiResponse {
  success: boolean;
  data?: CampaignStats[];
  stats?: RecipientStats[];
  campaign_stats?: any;
  recipients?: RecipientStats[];
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

  if (req.method === 'GET') {
    try {
      const { campaign_id, date_from, date_to, limit = 30 } = req.query;

      let query = 'SELECT * FROM email_statistics WHERE 1=1';
      const params: any[] = [];

      if (campaign_id) {
        query += ' AND campaign_id = ?';
        params.push(Number(campaign_id));
      }

      if (date_from) {
        query += ' AND date >= ?';
        params.push(date_from);
      }

      if (date_to) {
        query += ' AND date <= ?';
        params.push(date_to);
      }

      query += ' ORDER BY date DESC LIMIT ?';
      params.push(Number(limit));

      const statistics = await executeQuery({ query, values: params });

      return res.status(200).json({ success: true, data: statistics as CampaignStats[] });
    } catch (error: any) {
      console.error('Error al obtener estadísticas:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { campaign_id } = req.body;

      if (!campaign_id) {
        return res.status(400).json({
          success: false,
          error: 'campaign_id es requerido'
        });
      }

      // Obtener estadísticas de la campaña
      const campaignQuery = `
        SELECT 
          c.id,
          c.name,
          c.status,
          c.total_sent,
          c.total_opened,
          c.total_clicked,
          c.total_bounced,
          c.total_unsubscribed,
          c.open_rate,
          c.click_rate,
          c.sent_at
        FROM email_campaigns c
        WHERE c.id = ?
      `;

      const campaignStats = await executeQuery({
        query: campaignQuery,
        values: [campaign_id]
      });

      // Obtener historial de envíos
      const recipientsQuery = `
        SELECT 
          r.id,
          r.campaign_id,
          r.recipient_id,
          r.status,
          r.sent_at,
          r.opened_at,
          r.clicked_at
        FROM email_campaign_recipients r
        WHERE r.campaign_id = ?
        ORDER BY r.sent_at DESC
        LIMIT 100
      `;

      const recipients = await executeQuery({
        query: recipientsQuery,
        values: [campaign_id]
      });

      return res.status(200).json({
        success: true,
        campaign_stats: (campaignStats as any[])[0],
        recipients: recipients as RecipientStats[]
      });
    } catch (error: any) {
      console.error('Error al obtener estadísticas de campaña:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}

export default withAuth(handler);
