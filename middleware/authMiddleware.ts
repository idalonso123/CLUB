import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import executeQuery from '@/lib/db';

interface DecodedToken {
  userId: number;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    userId: number;
    email: string;
    role?: string;
    getRole: () => Promise<string>;
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    try {
      const token = getTokenFromRequest(req);
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'No has iniciado sesión. Se requiere autenticación.'
        });
      }

      const JWT_SECRET = process.env.JWT_SECRET || 'club-viveverde-secret-key';
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
        
        const authReq = req as AuthenticatedRequest;
        authReq.user = {
          userId: decoded.userId,
          email: decoded.email,
          getRole: async (): Promise<string> => {
            if (authReq.user && authReq.user.role) {
              return authReq.user.role;
            }
            const role = await getUserRole(decoded.userId);
            if (authReq.user) {
              authReq.user.role = role;
            }
            return role;
          }
        };
        
        return handler(authReq, res);
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Sesión expirada o no válida. Por favor, vuelve a iniciar sesión.'
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor al validar la autenticación.'
      });
    }
  };
}

function getTokenFromRequest(req: NextApiRequest): string | null {
  const cookies = req.cookies || (req.headers.cookie ? cookie.parse(req.headers.cookie as string) : {});
  const tokenFromCookie = cookies.auth_token;
  
  if (tokenFromCookie) {
    return tokenFromCookie;
  }
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}

export async function getUserRole(userId: number): Promise<string> {
  try {
    const result = await executeQuery({
      query: `
        SELECT rol
        FROM personas
        WHERE codigo = ?
      `,
      values: [userId]
    });
    
    const users = result as any[];
    
    if (!users || users.length === 0) {
      return 'user';
    }
    
    return users[0].rol?.toLowerCase() || 'user';
  } catch (error) {
    return 'user';
  }
}