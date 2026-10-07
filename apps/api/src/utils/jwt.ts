import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface JwtPayload {
  userId: string;
  email: string;
}

export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as any,
  });
};

export const verifyToken = (token: string): { payload?: JwtPayload; isExpired?: boolean; error?: string } => {
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
    return { payload: decoded };
  } catch (err: any) {
    if (err instanceof TokenExpiredError) {
      return { isExpired: true, error: 'Token has expired' };
    }
    return { error: 'Invalid token' };
  }
};
