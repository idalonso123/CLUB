import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '../../../lib/db';

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
  data?: EmailTemplate[];
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

  if (req.method === 'GET') {
    try {
      const { type, active } = req.query;

      let query = 'SELECT * FROM email_templates WHERE 1=1';
      const params: any[] = [];

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      if (active !== undefined) {
        query += ' AND is_active = ?';
        params.push(active === 'true');
      }

      query += ' ORDER BY created_at DESC';

      const templates = await executeQuery({ query, values: params });

      return res.status(200).json({ success: true, data: templates as EmailTemplate[] });
    } catch (error: any) {
      console.error('Error al obtener plantillas:', error);
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
        type = 'custom', 
        variables, 
        styles,
        is_active = true,
        description 
      } = req.body;

      if (!name || !subject || !content) {
        return res.status(400).json({
          success: false,
          error: 'Faltan campos requeridos: name, subject, content'
        });
      }

      const query = `
        INSERT INTO email_templates (name, subject, preheader, content, type, variables, styles, is_active, description, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = await executeQuery({
        query,
        values: [
          name, 
          subject, 
          preheader || null,
          content, 
          type, 
          variables ? JSON.stringify(variables) : null,
          styles || null,
          is_active,
          description || null,
          req.user?.userId
        ]
      });

      const insertResult = result as any;
      const newTemplate = await executeQuery({
        query: 'SELECT * FROM email_templates WHERE id = ?',
        values: [insertResult.insertId]
      });

      return res.status(201).json({
        success: true,
        template: (newTemplate as any[])[0] as EmailTemplate
      });
    } catch (error: any) {
      console.error('Error al crear plantilla:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  return res.status(405).json({ success: false, error: 'Método no permitido' });
}

export default withAuth(handler);
