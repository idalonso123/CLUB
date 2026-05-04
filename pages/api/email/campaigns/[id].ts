import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '../../../../lib/db';

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

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const campaign = await executeQuery({
        query: 'SELECT * FROM email_campaigns WHERE id = ?',
        values: [id]
      });

      if ((campaign as any[]).length === 0) {
        return res.status(404).json({ success: false, error: 'Campaña no encontrada' });
      }

      return res.status(200).json({
        success: true,
        campaign: (campaign as any[])[0] as EmailCampaign
      });
    } catch (error: any) {
      console.error('Error al obtener campaña:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { 
        name, 
        subject, 
        preheader,
        content, 
        type,
        description,
        template_id, 
        scheduled_at, 
        segment_id,
        filter_criteria,
        status 
      } = req.body;

      if (!name || !subject || !content || !template_id) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos: name, subject, content, template_id'
        });
      }

      const query = `
        UPDATE email_campaigns
        SET name = ?, subject = ?, preheader = ?, content = ?, type = ?, description = ?,
            template_id = ?, scheduled_at = ?, segment_id = ?, filter_criteria = ?,
            status = ?, updated_at = NOW()
        WHERE id = ?
      `;

      await executeQuery({
        query,
        values: [
          name,
          subject,
          preheader || null,
          content,
          type || 'newsletter',
          description || null,
          template_id,
          scheduled_at || null,
          segment_id || null,
          filter_criteria || null,
          status || 'draft',
          id
        ]
      });

      const updatedCampaign = await executeQuery({
        query: 'SELECT * FROM email_campaigns WHERE id = ?',
        values: [id]
      });

      return res.status(200).json({
        success: true,
        campaign: (updatedCampaign as any[])[0] as EmailCampaign
      });
    } catch (error: any) {
      console.error('Error al actualizar campaña:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await executeQuery({
        query: 'DELETE FROM email_campaigns WHERE id = ?',
        values: [id]
      });

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error al eliminar campaña:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}

export default withAuth(handler);
