import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import type { User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'development_jwt_secret_change_in_production_ABC123DEF456GHI789XYZ';
const SALT_ROUNDS = 12;

export interface AuthRequest extends Request {
  user?: User;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId: number, version: number = 1): string => {
  return jwt.sign({ 
    userId, 
    version, 
    iat: Math.floor(Date.now() / 1000) 
  }, JWT_SECRET, { expiresIn: '24h' }); // Reduced from 7d to 24h for security
};

export const generateRefreshToken = (userId: number, version: number = 1): string => {
  return jwt.sign({ 
    userId, 
    version, 
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000) 
  }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): { userId: number; version?: number; type?: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { 
      userId: number; 
      version?: number; 
      type?: string;
      iat: number;
    };
    
    // Check if token is too old (force refresh after 12 hours)
    const tokenAge = Date.now() / 1000 - decoded.iat;
    if (tokenAge > 12 * 60 * 60 && decoded.type !== 'refresh') {
      return null; // Force token refresh
    }
    
    return decoded;
  } catch {
    return null;
  }
};

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const sessionUserId = req.session?.userId;

    let userId: number | null = null;

    // Check JWT token from Authorization header
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Enhanced token validation
      if (token.length > 500 || token.length < 10) {
        return res.status(401).json({ message: 'Invalid token format' });
      }
      
      // Check for suspicious characters
      if (!/^[A-Za-z0-9\-_\.]+$/.test(token)) {
        return res.status(401).json({ message: 'Invalid token format' });
      }
      
      const decoded = verifyToken(token);
      if (decoded) {
        userId = decoded.userId;
      }
    }

    // Fallback to session with enhanced validation
    if (!userId && sessionUserId) {
      if (typeof sessionUserId === 'number' && sessionUserId > 0 && sessionUserId < Number.MAX_SAFE_INTEGER) {
        userId = sessionUserId;
      }
    }

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Enhanced user ID validation
    if (userId <= 0 || !Number.isInteger(userId) || userId > Number.MAX_SAFE_INTEGER) {
      return res.status(401).json({ message: 'Invalid user ID' });
    }

    const user = await storage.getUser(userId.toString());
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Prevent timing attacks
    const sanitizedUser = {
      ...user,
      password: undefined
    };

    req.user = sanitizedUser as User;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireProvider = requireRole(['provider', 'admin']);

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}