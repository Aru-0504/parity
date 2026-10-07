import rateLimit from 'express-rate-limit';
import { ErrorCode } from '@ismo/shared';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 authentication requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: ErrorCode.RATE_LIMITED,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
});

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: ErrorCode.RATE_LIMITED,
    message: 'Too many requests, please slow down',
  },
});
