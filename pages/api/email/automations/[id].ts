import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '../../../../lib/db';

interface EmailAutomation {
  id: number;
  name: string;
  trigger_type: 'signup' | 'purchase' | 'points_milestone' | 'birthday' | 'inactivity' | 'anniversary' | 'custom_date';
  trigger_config: string | null;
  template_id: number;
  delay_days: number;
  delay_hours: number;
  conditions: string | null;
  is_active: boolean;
  total_triggered: number;
  total_sent: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  template_name?: string;
  template_subject?: string;
}

interface ApiResponse {
  success: boolean;
  automation?: EmailAutomation;
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
      const automation = await executeQuery({
        query: `
          SELECT 
            a.*,
            t.name as template_name,
            t.subject as template_subject
          FROM email_automations a
          LEFT JOIN email_templates t ON a.template_id = t.id
          WHERE a.id = ?
        `,
        values: [id]
      });

      if ((automation as any[]).length === 0) {
        return res.status(404).json({ success: false, error: 'Automatización no encontrada' });
      }

      return res.status(200).json({
        success: true,
        automation: (automation as any[])[0] as EmailAutomation
      });
    } catch (error: any) {
      console.error('Error al obtener automatización:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { 
        name, 
        trigger_type, 
        trigger_config,
        template_id,
        delay_days,
        delay_hours,
        conditions,
        is_active
      } = req.body;

      if (!name || !trigger_type || !template_id) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos: name, trigger_type, template_id'
        });
      }

      const validTriggerTypes = ['signup', 'purchase', 'birthday', 'inactivity', 'points_milestone', 'anniversary', 'custom_date'];
      if (!validTriggerTypes.includes(trigger_type)) {
        return res.status(400).json({
          success: false,
          error: 'Tipo de disparador inválido'
        });
      }

      const query = `
        UPDATE email_automations
        SET name = ?, trigger_type = ?, trigger_config = ?, 
            template_id = ?, delay_days = ?, delay_hours = ?, 
            conditions = ?, is_active = ?
        WHERE id = ?
      `;

      await executeQuery({
        query,
        values: [
          name,
          trigger_type,
          trigger_config ? JSON.stringify(trigger_config) : null,
          template_id,
          delay_days ?? 0,
          delay_hours ?? 0,
          conditions ? JSON.stringify(conditions) : null,
          is_active ? 1 : 0,
          id
        ]
      });

      const updatedAutomation = await executeQuery({
        query: `
          SELECT 
            a.*,
            t.name as template_name,
            t.subject as template_subject
          FROM email_automations a
          LEFT JOIN email_templates t ON a.template_id = t.id
          WHERE a.id = ?
        `,
        values: [id]
      });

      return res.status(200).json({
        success: true,
        automation: (updatedAutomation as any[])[0] as EmailAutomation
      });
    } catch (error: any) {
      console.error('Error al actualizar automatización:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await executeQuery({
        query: 'DELETE FROM email_automations WHERE id = ?',
        values: [id]
      });

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error al eliminar automatización:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}

export default withAuth(handler);
