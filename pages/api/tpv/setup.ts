/**
 * API endpoint para verificar estado del TPV
 * 
 * IMPORTANTE: La verificación real de si la app Electron está instalada
 * se hace en el navegador del cliente (pages/tpv.tsx) usando el protocolo
 * clubviveverde://
 * 
 * Este endpoint solo devuelve información básica de diagnóstico del servidor.
 */

import { NextApiRequest, NextApiResponse } from "next";

interface SetupStatus {
  electronInstalled: boolean;
  dependenciesConfigured: boolean;
  canRunElectron: boolean;
  message: string;
  needsSetup: boolean;
  checkOnClient: boolean; // Indica que la verificación real se hace en el cliente
}

interface InstallResult {
  success: boolean;
  message: string;
  error?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Solo permitir método GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Verificar que el usuario está autenticado y tiene rol de cajero
  try {
    const profileResp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/user/profile`, {
      headers: {
        Cookie: req.headers.cookie || "",
      },
    });

    if (!profileResp.ok) {
      return res.status(401).json({ error: "No autenticado" });
    }

    const profile = await profileResp.json();
    if (profile.user?.role !== "cajero") {
      return res.status(403).json({ error: "Acceso solo para cajeros" });
    }
  } catch {
    return res.status(401).json({ error: "No autenticado" });
  }

  // Verificar si es una solicitud de instalación
  const action = req.query.action as string;

  if (action === "install") {
    return handleInstall(req, res);
  }

  if (action === "status") {
    return handleStatus(req, res);
  }

  // Estado por defecto
  return handleStatus(req, res);
}

/**
 * Verificar estado - Esta función ya no verifica Electron en el servidor
 * porque Electron se instala en los PCs de las cajeras, nunca en el servidor.
 * La verificación real se hace en el navegador del cliente.
 */
async function handleStatus(req: NextApiRequest, res: NextApiResponse) {
  // Siempre devolver que necesita setup porque la verificación real
  // se hace en el navegador del cliente
  const status: SetupStatus = {
    electronInstalled: false,
    dependenciesConfigured: false,
    canRunElectron: false,
    message: "La verificación de la aplicación se realiza en el navegador del cliente",
    needsSetup: false, // No bloqueamos - el cliente verificará
    checkOnClient: true // Indica que la verificación real se hace en el cliente
  };

  return res.status(200).json(status);
}

async function handleInstall(req: NextApiRequest, res: NextApiResponse) {
  const result: InstallResult = {
    success: false,
    message: "La instalación debe realizarse en el PC del cliente. Descarga el instalador desde la aplicación web.",
  };

  // No intentamos instalar nada en el servidor
  return res.status(200).json(result);
}