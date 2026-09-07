import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const s = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  return s.toUpperCase() || '?';
}

const TTL_MS = Number(process.env.SESSION_TTL_HOURS ?? 12) * 3_600_000;

export interface PublicUser {
  id: string;
  username: string;
  name: string;
  initials: string;
  isSuperuser: boolean;
  mustChangePassword: boolean;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /** Dipakai seed & alur ganti sandi. */
  static hashPassword(pw: string): Promise<string> {
    return argonHash(pw);
  }

  async login(username: string, password: string, ip?: string, ua?: string) {
    const generic = 'Nama pengguna atau kata sandi salah.';
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user || !user.isActive) throw new UnauthorizedException(generic);

    let ok = false;
    try {
      ok = await argonVerify(user.passwordHash, password);
    } catch {
      ok = false;
    }
    if (!ok) throw new UnauthorizedException(generic);

    const token = randomBytes(32).toString('hex');
    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash: sha256(token),
        ip: ip ?? null,
        userAgent: ua ?? null,
        expiresAt: new Date(Date.now() + TTL_MS),
      },
    });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { user, token, ttlMs: TTL_MS };
  }

  async logout(token?: string): Promise<void> {
    if (token) await this.prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }

  publicUser(u: User): PublicUser {
    return {
      id: u.id,
      username: u.username,
      name: u.displayName,
      initials: initialsOf(u.displayName),
      isSuperuser: u.isSuperuser,
      mustChangePassword: u.mustChangePassword,
    };
  }
}
