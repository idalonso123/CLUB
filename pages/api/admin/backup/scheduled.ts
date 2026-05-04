/**
 * API para gestionar los backups programados
 * CRUD completo para la tabla backup_scheduled
 */

import { NextApiRequest, NextApiResponse } from "next";
import { withAuth, AuthenticatedRequest } from "@/middleware/authMiddleware";
import executeQuery from "@/lib/db";

interface ScheduledBackup {
  id: number;
  name: string;
  backup_type: "database" | "files" | "full";
  schedule_type: "hourly" | "daily" | "weekly" | "monthly";
  time: string;
  day_of_week: number | null;
  day_of_month: number | null;
  enabled: boolean;
  last_run: string | null;
  next_run: string | null;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const userRole = await req.user?.getRole();
  if (userRole !== "administrador" && userRole !== "admin") {
    return res.status(403).json({ success: false, message: "No autorizado" });
  }

  // GET: Obtener todos los backups programados
  if (req.method === "GET") {
    try {
      const rows = await executeQuery({
        query: "SELECT * FROM backup_scheduled ORDER BY id ASC",
        values: [],
      }) as any[];

      const schedules: ScheduledBackup[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        backup_type: row.backup_type,
        schedule_type: row.schedule_type,
        time: row.time,
        day_of_week: row.day_of_week,
        day_of_month: row.day_of_month,
        enabled: Boolean(row.enabled),
        last_run: row.last_run ? new Date(row.last_run).toISOString() : null,
        next_run: row.next_run ? new Date(row.next_run).toISOString() : null,
      }));

      return res.status(200).json({ success: true, data: schedules });
    } catch (error: any) {
      console.error("Error al obtener backups programados:", error);
      
      if (error.message?.includes("not exist") || error.code === "ER_NO_SUCH_TABLE") {
        return res.status(500).json({
          success: false,
          message: "La tabla backup_scheduled no existe. Ejecuta el script SQL.",
          error: "Tabla no encontrada",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error al obtener backups programados",
        error: error.message,
      });
    }
  }

  // POST: Crear nuevo backup programado
  if (req.method === "POST") {
    try {
      const { name, backup_type, schedule_type, time, day_of_week, day_of_month, enabled } = req.body;

      // Validaciones
      if (!name || typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({ success: false, message: "El nombre es requerido" });
      }

      if (!backup_type || !["database", "files", "full"].includes(backup_type)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de backup inválido. Use: database, files, o full",
        });
      }

      if (!schedule_type || !["hourly", "daily", "weekly", "monthly"].includes(schedule_type)) {
        return res.status(400).json({
          success: false,
          message: "Tipo de programación inválido. Use: hourly, daily, weekly, o monthly",
        });
      }

      // Calcular próxima ejecución
      const now = new Date();
      const [hours, minutes] = (time || "02:00").split(":").map(Number);
      let nextRun = new Date(now);
      nextRun.setHours(hours, minutes, 0, 0);

      if (nextRun <= now) {
        switch (schedule_type) {
          case "hourly":
            nextRun.setHours(nextRun.getHours() + 1);
            break;
          case "daily":
            nextRun.setDate(nextRun.getDate() + 1);
            break;
          case "weekly":
            const daysUntilNext = (7 - now.getDay() + (day_of_week || 0)) % 7 || 7;
            nextRun.setDate(nextRun.getDate() + daysUntilNext);
            break;
          case "monthly":
            nextRun.setMonth(nextRun.getMonth() + 1);
            if (day_of_month) {
              const lastDay = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate();
              nextRun.setDate(Math.min(day_of_month, lastDay));
            }
            break;
        }
      }

      const result = await executeQuery({
        query: `
          INSERT INTO backup_scheduled 
          (name, backup_type, schedule_type, time, day_of_week, day_of_month, enabled, next_run)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          name.trim(),
          backup_type,
          schedule_type,
          time || "02:00:00",
          schedule_type === "weekly" ? day_of_week : null,
          schedule_type === "monthly" ? day_of_month : null,
          enabled !== false ? 1 : 0,
          nextRun.toISOString(),
        ],
      }) as any;

      return res.status(201).json({
        success: true,
        message: "Backup programado creado exitosamente",
        data: {
          id: result.insertId,
          name: name.trim(),
          backup_type,
          schedule_type,
          time: time || "02:00:00",
          day_of_week: schedule_type === "weekly" ? day_of_week : null,
          day_of_month: schedule_type === "monthly" ? day_of_month : null,
          enabled: enabled !== false,
          next_run: nextRun.toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Error al crear backup programado:", error);

      if (error.message?.includes("not exist") || error.code === "ER_NO_SUCH_TABLE") {
        return res.status(500).json({
          success: false,
          message: "La tabla backup_scheduled no existe. Ejecuta el script SQL.",
          error: "Tabla no encontrada",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Error al crear backup programado",
        error: error.message,
      });
    }
  }

  // PUT: Actualizar backup programado
  if (req.method === "PUT") {
    try {
      const { id, name, backup_type, schedule_type, time, day_of_week, day_of_month, enabled } = req.body;

      if (!id) {
        return res.status(400).json({ success: false, message: "ID es requerido" });
      }

      // Verificar que existe
      const existing = await executeQuery({
        query: "SELECT id FROM backup_scheduled WHERE id = ?",
        values: [id],
      }) as any[];

      if (existing.length === 0) {
        return res.status(404).json({ success: false, message: "Backup programado no encontrado" });
      }

      // Recalcular próxima ejecución si cambió la programación
      let nextRun = null;
      if (schedule_type && time) {
        const now = new Date();
        const [hours, minutes] = time.split(":").map(Number);
        nextRun = new Date(now);
        nextRun.setHours(hours, minutes, 0, 0);

        if (nextRun <= now) {
          switch (schedule_type) {
            case "hourly":
              nextRun.setHours(nextRun.getHours() + 1);
              break;
            case "daily":
              nextRun.setDate(nextRun.getDate() + 1);
              break;
            case "weekly":
              const daysUntilNext = (7 - now.getDay() + (day_of_week || 0)) % 7 || 7;
              nextRun.setDate(nextRun.getDate() + daysUntilNext);
              break;
            case "monthly":
              nextRun.setMonth(nextRun.getMonth() + 1);
              if (day_of_month) {
                const lastDay = new Date(nextRun.getFullYear(), nextRun.getMonth() + 1, 0).getDate();
                nextRun.setDate(Math.min(day_of_month, lastDay));
              }
              break;
          }
        }
      }

      await executeQuery({
        query: `
          UPDATE backup_scheduled 
          SET name = COALESCE(?, name),
              backup_type = COALESCE(?, backup_type),
              schedule_type = COALESCE(?, schedule_type),
              time = COALESCE(?, time),
              day_of_week = ?,
              day_of_month = ?,
              enabled = COALESCE(?, enabled),
              next_run = COALESCE(?, next_run)
          WHERE id = ?
        `,
        values: [
          name?.trim() || null,
          backup_type || null,
          schedule_type || null,
          time || null,
          schedule_type === "weekly" ? day_of_week : null,
          schedule_type === "monthly" ? day_of_month : null,
          enabled !== undefined ? (enabled ? 1 : 0) : null,
          nextRun ? nextRun.toISOString() : null,
          id,
        ],
      });

      // Obtener el registro actualizado
      const updated = await executeQuery({
        query: "SELECT * FROM backup_scheduled WHERE id = ?",
        values: [id],
      }) as any[];

      return res.status(200).json({
        success: true,
        message: "Backup programado actualizado exitosamente",
        data: {
          id: updated[0].id,
          name: updated[0].name,
          backup_type: updated[0].backup_type,
          schedule_type: updated[0].schedule_type,
          time: updated[0].time,
          day_of_week: updated[0].day_of_week,
          day_of_month: updated[0].day_of_month,
          enabled: Boolean(updated[0].enabled),
          last_run: updated[0].last_run ? new Date(updated[0].last_run).toISOString() : null,
          next_run: updated[0].next_run ? new Date(updated[0].next_run).toISOString() : null,
        },
      });
    } catch (error: any) {
      console.error("Error al actualizar backup programado:", error);
      return res.status(500).json({
        success: false,
        message: "Error al actualizar backup programado",
        error: error.message,
      });
    }
  }

  // DELETE: Eliminar backup programado
  if (req.method === "DELETE") {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ success: false, message: "ID es requerido" });
      }

      const result = await executeQuery({
        query: "DELETE FROM backup_scheduled WHERE id = ?",
        values: [id],
      }) as any;

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Backup programado no encontrado" });
      }

      return res.status(200).json({
        success: true,
        message: "Backup programado eliminado exitosamente",
      });
    } catch (error: any) {
      console.error("Error al eliminar backup programado:", error);
      return res.status(500).json({
        success: false,
        message: "Error al eliminar backup programado",
        error: error.message,
      });
    }
  }

  return res.status(405).json({ success: false, message: "Método no permitido" });
}

export default withAuth(handler);