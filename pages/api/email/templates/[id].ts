import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '../../../../lib/db';

interface EmailTemplate {
  id: number;
  name: string;
  type: 'welcome' | 'newsletter' | 'promotion' | 'notification' | 'reminder' | 'birthday' | 'custom';
  subject: string;
  preheader: string | null;
  content: string;
  variables: string | null;
  styles: string | null;
  is_active: boolean;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  template?: EmailTemplate;
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
      const template = await executeQuery({
        query: 'SELECT * FROM email_templates WHERE id = ?',
        values: [id]
      });

      if ((template as any[]).length === 0) {
        return res.status(404).json({ success: false, error: 'Plantilla no encontrada' });
      }

      return res.status(200).json({
        success: true,
        template: (template as any[])[0] as EmailTemplate
      });
    } catch (error: any) {
      console.error('Error al obtener plantilla:', error);
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
        variables, 
        styles,
        is_active,
        description 
      } = req.body;

      if (!name || !subject || !content) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos: name, subject, content'
        });
      }

      const query = `
        UPDATE email_templates
        SET name = ?, subject = ?, preheader = ?, content = ?, type = ?, variables = ?, styles = ?, is_active = ?, description = ?
        WHERE id = ?
      `;

      await executeQuery({
        query,
        values: [
          name, 
          subject, 
          preheader || null,
          content, 
          type || 'custom', 
          variables ? JSON.stringify(variables) : null,
          styles || null,
          is_active ?? true,
          description || null,
          id
        ]
      });

      const updatedTemplate = await executeQuery({
        query: 'SELECT * FROM email_templates WHERE id = ?',
        values: [id]
      });

      return res.status(200).json({
        success: true,
        template: (updatedTemplate as any[])[0] as EmailTemplate
      });
    } catch (error: any) {
      console.error('Error al actualizar plantilla:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await executeQuery({
        query: 'DELETE FROM email_templates WHERE id = ?',
        values: [id]
      });

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error al eliminar plantilla:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}

export default withAuth(handler);
