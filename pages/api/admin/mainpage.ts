import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/middleware/authMiddleware';
import executeQuery from '@/lib/db';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Solo admin
  const userRole = await req.user?.getRole();
  if (userRole !== 'administrador' && userRole !== 'admin') {
    return res.status(403).json({ success: false, message: 'No autorizado' });
  }

  // GET: obtener todo (igual que público, pero aquí puedes añadir más info si quieres)
  if (req.method === 'GET') {
    try {
      const sliders = await executeQuery({
        query: 'SELECT id, title, description, image_url AS imageUrl, button_text AS buttonText, button_url AS buttonUrl, active, orden FROM mainpage_sliders ORDER BY orden ASC, id ASC',
        values: []
      });
      const cards = await executeQuery({
        query: 'SELECT id, title, content, icon_class AS iconClass, contact_url AS contactUrl, button_text AS buttonText, active, orden FROM mainpage_cards ORDER BY orden ASC, id ASC',
        values: []
      });
      const featured = await executeQuery({
        query: 'SELECT * FROM mainpage_featured ORDER BY orden ASC, id ASC',
        values: []
      });
      return res.status(200).json({ success: true, sliders, cards, featured });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al obtener contenido', error: (error as Error).message });
    }
  }

  // POST: crear elemento (body: { type: 'slider'|'card'|'featured', data: {...} })
  if (req.method === 'POST') {
    const { type, data } = req.body;
    if (!type || !data) return res.status(400).json({ success: false, message: 'Faltan datos' });

    try {
      let result;
      if (type === 'slider') {
        result = await executeQuery({
          query: `INSERT INTO mainpage_sliders (title, description, image_url, button_text, button_url, active, orden)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
          values: [
            data.title, 
            data.description, 
            data.imageUrl, 
            data.buttonText && data.buttonText.trim() ? data.buttonText : null, 
            data.buttonUrl && data.buttonUrl.trim() ? data.buttonUrl : null, 
            data.active ? 1 : 0, 
            data.orden || 0
          ]
        });
      } else if (type === 'card') {
        const maxIdResult: any = await executeQuery({
          query: 'SELECT MAX(id) as maxId FROM mainpage_cards',
          values: []
        });
        
        const nextId = maxIdResult && maxIdResult[0]?.maxId ? parseInt(maxIdResult[0].maxId as string) + 1 : 1;
        
        result = await executeQuery({
          query: `INSERT INTO mainpage_cards (id, title, content, icon_class, contact_url, button_text, active, orden)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          values: [nextId, data.title, data.content, data.iconClass || '', data.contactUrl || '', data.buttonText || '', 1, data.orden || 0]
        });
      } else if (type === 'featured') {
        result = await executeQuery({
          query: `INSERT INTO mainpage_featured (title, description, image_url, url, orden)
                  VALUES (?, ?, ?, ?, ?)`,
          values: [data.title, data.description, data.imageUrl, data.url, data.orden || 0]
        });
      } else {
        return res.status(400).json({ success: false, message: 'Tipo no válido' });
      }
      return res.status(201).json({ success: true, id: (result as any).insertId });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al crear', error: (error as Error).message });
    }
  }

  // PUT: actualizar elemento (body: { type, id, data })
  if (req.method === 'PUT') {
    const { type, id, data } = req.body;
    if (!type || !id || !data) return res.status(400).json({ success: false, message: 'Faltan datos' });

    try {
      let query = '', values: any[] = [];
      if (type === 'slider') {
        query = `UPDATE mainpage_sliders SET title=?, description=?, image_url=?, button_text=?, button_url=?, active=?, orden=? WHERE id=?`;
        values = [
          data.title, 
          data.description, 
          data.imageUrl, 
          data.buttonText && data.buttonText.trim() ? data.buttonText : null, 
          data.buttonUrl && data.buttonUrl.trim() ? data.buttonUrl : null, 
          data.active ? 1 : 0, 
          data.orden || 0, 
          id
        ];
      } else if (type === 'card') {
        query = `UPDATE mainpage_cards SET title=?, content=?, icon_class=?, contact_url=?, button_text=?, active=?, orden=? WHERE id=?`;
        values = [data.title, data.content, data.iconClass, data.contactUrl || '', data.buttonText || '', data.active ? 1 : 0, data.orden || 0, id];
      } else if (type === 'featured') {
        query = `UPDATE mainpage_featured SET title=?, description=?, image_url=?, url=?, orden=? WHERE id=?`;
        values = [data.title, data.description, data.imageUrl, data.url, data.orden || 0, id];
      } else {
        return res.status(400).json({ success: false, message: 'Tipo no válido' });
      }
      await executeQuery({ query, values });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al actualizar', error: (error as Error).message });
    }
  }

  // DELETE: eliminar elemento (body: { type, id })
  if (req.method === 'DELETE') {
    const { type, id } = req.body;
    if (!type || !id) return res.status(400).json({ success: false, message: 'Faltan datos' });

    try {
      let query = '';
      if (type === 'slider') query = 'DELETE FROM mainpage_sliders WHERE id=?';
      else if (type === 'card') query = 'DELETE FROM mainpage_cards WHERE id=?';
      else if (type === 'featured') query = 'DELETE FROM mainpage_featured WHERE id=?';
      else return res.status(400).json({ success: false, message: 'Tipo no válido' });

      await executeQuery({ query, values: [id] });
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Error al eliminar', error: (error as Error).message });
    }
  }

  return res.status(405).json({ success: false, message: 'Método no permitido' });
}

export default withAuth(handler);
