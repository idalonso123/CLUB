import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '../../../lib/db';

interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  preheader: string | null;
  content: string;
  type: 'newsletter' | 'promotion' | 'notification' | 'reminder' | 'birthday' | 'welcome' | 'segment' | 'automated';
  description: string | null;
  template_id: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'completed' | 'cancelled' | 'failed';
  segment_id: number | null;
  scheduled_at: string | null;
  filter_criteria: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_unsubscribed: number;
  open_rate: number;
  click_rate: number;
}

interface ApiResponse {
  success: boolean;
  data?: EmailCampaign[];
  campaign?: EmailCampaign;
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
      const { status, limit = 50, offset = 0 } = req.query;

      let query = 'SELECT * FROM email_campaigns WHERE 1=1';
      const params: any[] = [];

      if (status) {
        query += ' AND status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(Number(limit), Number(offset));

      const campaigns = await executeQuery({ query, values: params });

      return res.status(200).json({ success: true, data: campaigns as EmailCampaign[] });
    } catch (error: any) {
      console.error('Error al obtener campañas:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const {
        name,
        subject,
        preheader,
        content,
        type = 'newsletter',
        description,
        template_id,
        scheduled_at,
        segment_id,
        filter_criteria
      } = req.body;

      if (!name || !subject || !content || !template_id) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos: name, subject, content, template_id'
        });
      }

      const status = scheduled_at ? 'scheduled' : 'draft';

      const query = `
        INSERT INTO email_campaigns
        (name, subject, preheader, content, type, description, template_id, status, scheduled_at, segment_id, filter_criteria, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await executeQuery({
        query,
        values: [
          name,
          subject,
          preheader || null,
          content,
          type,
          description || null,
          template_id,
          status,
          scheduled_at || null,
          segment_id || null,
          filter_criteria || null,
          req.user?.userId
        ]
      });

      const insertResult = result as any;
      const newCampaign = await executeQuery({
        query: 'SELECT * FROM email_campaigns WHERE id = ?',
        values: [insertResult.insertId]
      });

      return res.status(201).json({
        success: true,
        campaign: (newCampaign as any[])[0] as EmailCampaign
      });
    } catch (error: any) {
      console.error('Error al crear campaña:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}

export default withAuth(handler);
