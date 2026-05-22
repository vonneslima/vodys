import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { cache, CACHE_KEYS } from '../config/redis';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import {
  AppError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/response';
import { emailService } from './email.service';
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  ChangePasswordInput,
} from '../schemas/auth.schema';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// converte "7d", "15m", "1h" em Date real
const calculateExpiryDate = (expiresIn: string): Date => {
  const match = expiresIn.match(/^(\d+)([smhd])$/);

  if (!match) {
    throw new Error(`Formato inválido de expiração: ${expiresIn}`);
  }

  const value = parseInt(match[1]);
  const unit = match[2];

  const now = new Date();

  switch (unit) {
    case 's':
      now.setSeconds(now.getSeconds() + value);
      break;
    case 'm':
      now.setMinutes(now.getMinutes() + value);
      break;
    case 'h':
      now.setHours(now.getHours() + value);
      break;
    case 'd':
      now.setDate(now.getDate() + value);
      break;
  }

  return now;
};

const buildTokenPair = async (
  userId: string,
  username: string,
  role: string,
  meta?: { userAgent?: string; ipAddress?: string }
): Promise<AuthTokens> => {
  const tokenId = uuidv4();

  const accessToken = generateAccessToken({
    sub: userId,
    username,
    role,
  });

  const refreshToken = generateRefreshToken(userId, tokenId);

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      token: refreshToken,
      userId,
      expiresAt: calculateExpiryDate('7d'),
      userAgent: meta?.userAgent,
      ipAddress: meta?.ipAddress,
    },
  });

  return { accessToken, refreshToken };
};

export const authService = {
  async register(input: RegisterInput): Promise<AuthTokens & { userId: string }> {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email },
          { username: input.username },
        ],
      },
      select: {
        email: true,
        username: true,
      },
    });

    if (existing) {
      if (existing.email === input.email) {
        throw new ConflictError('Email already in use');
      }

      throw new ConflictError('Username already taken');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
      },
      select: {
        id: true,
        username: true,
        role: true,
      },
    });

    const tokens = await buildTokenPair(
      user.id,
      user.username,
      user.role
    );

    emailService
      .sendWelcome(input.email, input.firstName)
      .catch((err) => console.error('Welcome email failed:', err));

    return {
      ...tokens,
      userId: user.id,
    };
  },

  async login(
    input: LoginInput,
    meta?: { userAgent?: string; ipAddress?: string }
  ): Promise<AuthTokens & { userId: string }> {
    const user = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
      select: {
        id: true,
        username: true,
        role: true,
        passwordHash: true,
        isActive: true,
      },
    });

    const isValid = user
      ? await comparePassword(input.password, user.passwordHash)
      : false;

    if (!user || !isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Account has been deactivated');
    }

    const tokens = await buildTokenPair(
      user.id,
      user.username,
      user.role,
      meta
    );

    return {
      ...tokens,
      userId: user.id,
    };
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);

    const stored = await prisma.refreshToken.findUnique({
      where: {
        token: refreshToken,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            isActive: true,
          },
        },
      },
    });

    if (!stored || stored.revokedAt || new Date() > stored.expiresAt) {
      if (stored) {
        await prisma.refreshToken.updateMany({
          where: {
            userId: payload.sub,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
      }

      throw new UnauthorizedError(
        'Invalid or expired refresh token'
      );
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedError(
        'Account deactivated'
      );
    }

    await prisma.refreshToken.update({
      where: {
        id: stored.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return buildTokenPair(
      stored.user.id,
      stored.user.username,
      stored.user.role
    );
  },

  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },

  async forgotPassword(
    input: ForgotPasswordInput
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: {
        email: input.email,
      },
      select: {
        id: true,
        firstName: true,
        email: true,
      },
    });

    if (!user) return;

    const token = uuidv4();
    const expiresAt = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await prisma.passwordReset.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    await emailService
      .sendPasswordReset(
        user.email,
        user.firstName,
        token
      )
      .catch((err) =>
        console.error(
          'Password reset email failed:',
          err
        )
      );
  },

  async resetPassword(
    input: ResetPasswordInput
  ): Promise<void> {
    const reset = await prisma.passwordReset.findUnique({
      where: {
        token: input.token,
      },
    });

    if (
      !reset ||
      reset.usedAt ||
      new Date() > reset.expiresAt
    ) {
      throw new AppError(
        'Invalid or expired reset token',
        400
      );
    }

    const passwordHash = await hashPassword(
      input.password
    );

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: reset.userId,
        },
        data: {
          passwordHash,
        },
      }),
      prisma.passwordReset.update({
        where: {
          id: reset.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),
      prisma.refreshToken.updateMany({
        where: {
          userId: reset.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);
  },

  async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    const isValid = await comparePassword(
      input.currentPassword,
      user.passwordHash
    );

    if (!isValid) {
      throw new UnauthorizedError(
        'Current password is incorrect'
      );
    }

    const passwordHash = await hashPassword(
      input.newPassword
    );

    await prisma.$transaction([
      prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          passwordHash,
        },
      }),
      prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
    ]);

    await cache.del(
      CACHE_KEYS.userProfile(userId)
    );
  },
};