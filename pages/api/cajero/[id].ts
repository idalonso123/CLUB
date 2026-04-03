import { NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";
import { addMonths } from "date-fns";
import { getExpirationConfig } from "@/lib/configHelpers";
import { SacoItem } from "@/types/teller";

async function addBalanceHandler(req: AuthenticatedRequest, res: NextApiResponse) {
  // Solo admin o cajero
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin" && userRole !== "cajero") {
    return res.status(403).json({
      success: false,
      message: "No tienes permiso para acceder a esta funcionalidad",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Método no permitido",
    });
  }

  const { id } = req.query;
  const { amount, puntos, isCarnetAnimal, sacos } = req.body;

  if (!id || Array.isArray(id) || isNaN(Number(id))) {
    return res.status(400).json({ success: false, message: "ID de usuario no válido" });
  }
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: "Importe inválido" });
  }

  if (puntos === undefined || puntos === null || isNaN(Number(puntos)) || Number(puntos) < 0 || (!isCarnetAnimal && Number(puntos) === 0)) {
    return res.status(400).json({ success: false, message: "Puntos inválidos" });
  }

  try {
    const puntosAGanar = Math.round(Number(puntos));

    // Obtener puntos actuales
    const userResult = await executeQuery({
      query: "SELECT puntos FROM personas WHERE codigo = ?",
      values: [id],
    }) as Array<{ puntos: number }>;
    if (!userResult || userResult.length === 0) {
      return res.status(404).json({ success: false, message: "Usuario no encontrado" });
    }
    const puntosActuales = userResult[0].puntos || 0;
    const nuevosPuntos = puntosActuales + puntosAGanar;

    // Actualizar puntos
    await executeQuery({
      query: "UPDATE personas SET puntos = ? WHERE codigo = ?",
      values: [nuevosPuntos, id],
    });

    // Registrar en logs_points
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    if (puntosAGanar > 0) {
      // Obtener configuración de caducidad de la base de datos
      const expirationConfig = await getExpirationConfig();
      const fechaCaducidad = addMonths(new Date(), expirationConfig.caducidad_puntos_meses);

      await executeQuery({
        query: `
          INSERT INTO puntos_caducidad 
          (persona_id, puntos, fecha_ingreso, fecha_caducidad, caducado) 
          VALUES (?, ?, NOW(), ?, 0)
        `,
        values: [
          id,
          puntosAGanar,
          fechaCaducidad,
        ],
      });
    }

    const tipoCompra = isCarnetAnimal ? "Compra con Carnet mascota" : "Compra";
    let motivo = `${tipoCompra}: Saldo añadido por cajero/admin: ${amount}€`;
    
    if (isCarnetAnimal && Array.isArray(sacos) && sacos.length > 0) {
      const totalSacos = sacos.reduce((total, saco: SacoItem) => total + Number(saco.price), 0);
      const sacosInfo = sacos.map((saco: SacoItem) => `${saco.price}€`).join(", ");
      motivo += ` (${sacos.length} sacos [${sacosInfo}], total: ${totalSacos.toFixed(2)}€)`;
    }

    await executeQuery({
      query: `
        INSERT INTO logs_points 
        (tipo, actor_id, persona_id, puntos, puntos_previos, puntos_nuevos, motivo, fecha) 
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `,
      values: [
        isCarnetAnimal ? "Compra con Carnet mascota" : "Compra",
        req.user.userId,
        id,
        puntosAGanar,
        puntosActuales,
        nuevosPuntos,
        motivo,
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Saldo añadido correctamente",
      puntosAñadidos: puntosAGanar,
      puntosTotales: nuevosPuntos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error al añadir saldo",
      error: (error as Error).message,
    });
  }
}

export default withAuth(addBalanceHandler);
