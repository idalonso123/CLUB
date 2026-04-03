import type { NextApiRequest, NextApiResponse } from 'next';
import executeQuery from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Método no permitido' });
  }

  try {
    const sliders = await executeQuery({
      query: 'SELECT id, title, description, image_url AS imageUrl, button_text AS buttonText, button_url AS buttonUrl, active FROM mainpage_sliders WHERE active = 1 ORDER BY orden ASC, id ASC',
      values: []
    });

    const cards = await executeQuery({
      query: 'SELECT id, title, content, icon_class AS iconClass, contact_url AS contactUrl, button_text AS buttonText, active FROM mainpage_cards WHERE active = 1 ORDER BY orden ASC, id ASC',
      values: []
    });

    const featured = await executeQuery({
      query: 'SELECT id, title, description, image_url AS imageUrl, url FROM mainpage_featured ORDER BY orden ASC, id ASC',
      values: []
    });

    res.status(200).json({
      success: true,
      sliders,
      cards,
      featured
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener contenido', error: (error as Error).message });
  }
}
