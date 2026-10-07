import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/client';
import { signToken } from '../utils/jwt';
import { ErrorCode, RegisterInput, LoginInput } from '@ismo/shared';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fullName, email, password }: RegisterInput = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        code: ErrorCode.CONFLICT,
        message: 'An account with this email address already exists',
      });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password }: LoginInput = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid email or password',
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        code: ErrorCode.UNAUTHORIZED,
        message: 'Invalid email or password',
      });
      return;
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    res.status(200).json({
      success: true,
      data: {
        user: {
          ...user,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Stateless JWT logout confirms client can discard token
    res.status(200).json({
      success: true,
      message: 'Successfully logged out',
    });
  } catch (error) {
    next(error);
  }
};
