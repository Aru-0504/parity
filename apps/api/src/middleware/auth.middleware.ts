import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../db/client';
import { ErrorCode } from '@ismo/shared';

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      code: ErrorCode.UNAUTHORIZED,
      message: 'Authorization header missing or invalid format',
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  const { payload, isExpired } = verifyToken(token);

  if (isExpired) {
    res.status(401).json({
      success: false,
      code: ErrorCode.TOKEN_EXPIRED,
      message: 'Your session has expired. Please log in again.',
    });
    return;
  }

  if (!payload || !payload.userId) {
    res.status(401).json({
      success: false,
      code: ErrorCode.UNAUTHORIZED,
      message: 'Invalid authorization token',
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        code: ErrorCode.UNAUTHORIZED,
        message: 'User no longer exists',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
