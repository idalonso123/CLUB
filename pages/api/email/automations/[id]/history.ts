import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '../../../../../lib/db';

interface AutomationExecution {
  id: number;
  automation_id: number;
  subscriber_id: number;
  email: string;
  status: 'pending' | 'sent' | 'failed';
  executed_at: string;
  error_message: string | null;
  automation_name?: string;
  template_subject?: string;
}

interface ApiResponse {
  success: boolean;
  data?: AutomationExecution[];
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
      // Verificar si la tabla automation_logs existe
      const tablesQuery = `SHOW TABLES LIKE 'automation_logs'`;
      const tables = await executeQuery({ query: tablesQuery });
      
      if ((tables as any[]).length === 0) {
        // La tabla no existe, devolver array vacío
        return res.status(200).json({ success: true, data: [] });
      }

      let query = `
        SELECT 
          al.*,
          a.name as automation_name,
          t.subject as template_subject
        FROM automation_logs al
        LEFT JOIN email_automations a ON al.automation_id = a.id
        LEFT JOIN email_templates t ON a.template_id = t.id
        WHERE al.automation_id = ?
        ORDER BY al.executed_at DESC
        LIMIT 100
      `;

      const executions = await executeQuery({ query, values: [id] });

      return res.status(200).json({ success: true, data: executions as AutomationExecution[] });
    } catch (error: any) {
      console.error('Error al obtener historial de ejecuciones:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}

export default withAuth(handler);
