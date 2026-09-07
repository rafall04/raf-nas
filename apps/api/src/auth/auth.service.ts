import { BadRequestException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { hash as argonHash, verify as argonVerify } from '@node-rs/argon2';
import { authenticator } from 'otplib';
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
const REMEMBER_TTL_MS = Number(process.env.SESSION_REMEMBER_DAYS ?? 30) * 86_400_000;

// Rate limit login (in-memory, per proses). Cukup untuk satu server.
const MAX_FAILS = 5;
const LOCK_MS = 60_000;
const fails = new Map<string, { count: number; until: number }>();
function stateOf(key: string): { count: number; until: number } | undefined {
  const s = fails.get(key);
  if (s && s.until && s.until < Date.now()) {
    fails.delete(key);
    return undefined;
  }
  return s;
}
function lockedUntil(key: string): number {
  const s = stateOf(key);
  return s && s.until > Date.now() ? s.until : 0;
}
function recordFail(key: string): number {
  const s = stateOf(key) ?? { count: 0, until: 0 };
  s.count += 1;
  if (s.count >= MAX_FAILS) s.until = Date.now() + LOCK_MS;
  fails.set(key, s);
  return s.count;
}
function clearFails(key: string): void {
  fails.delete(key);
}

export interface PublicUser {
  id: string;
  username: string;
  name: string;
  initials: string;
  isSuperuser: boolean;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  static hashPassword(pw: string): Promise<string> {
    return argonHash(pw);
  }

  async login(username: string, password: string, code: string | undefined, ip?: string, ua?: string, remember = false) {
    const uKey = `u:${username}`;
    const ipKey = `ip:${ip ?? '?'}`;
    const locked = Math.max(lockedUntil(uKey), lockedUntil(ipKey));
    if (locked) {
      const retryAfter = Math.ceil((locked - Date.now()) / 1000);
      throw new HttpException({ message: `Terlalu banyak percobaan. Coba lagi dalam ${retryAfter} detik.`, retryAfter }, 429);
    }

    const generic = 'Nama pengguna atau kata sandi salah.';
    const user = await this.prisma.user.findUnique({ where: { username } });
    const okPw = user && user.isActive ? await argonVerify(user.passwordHash, password).catch(() => false) : false;
    if (!user || !user.isActive || !okPw) {
      const c = recordFail(uKey);
      recordFail(ipKey);
      throw new UnauthorizedException({ message: generic, remaining: Math.max(0, MAX_FAILS - c) });
    }

    if (user.twoFactorEnabled && user.twoFactorSecret) {
      if (!code) {
        throw new UnauthorizedException({ twoFactorRequired: true, message: 'Masukkan kode 2FA dari aplikasi authenticator.' });
      }
      const valid = authenticator.verify({ token: code.replace(/\s/g, ''), secret: user.twoFactorSecret });
      if (!valid) {
        recordFail(uKey);
        recordFail(ipKey);
        throw new UnauthorizedException({ twoFactorRequired: true, message: 'Kode 2FA salah.' });
      }
    }

    clearFails(uKey);
    clearFails(ipKey);
    const token = randomBytes(32).toString('hex');
    const ttlMs = remember ? REMEMBER_TTL_MS : TTL_MS;
    await this.prisma.session.create({
      data: { userId: user.id, tokenHash: sha256(token), ip: ip ?? null, userAgent: ua ?? null, expiresAt: new Date(Date.now() + ttlMs) },
    });
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { user, token, ttlMs };
  }

  async logout(token?: string): Promise<void> {
    if (token) await this.prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }

  async changePassword(user: User, oldPassword: string, newPassword: string, currentToken?: string): Promise<{ ok: boolean }> {
    if (!newPassword || newPassword.length < 8) throw new BadRequestException('Kata sandi baru minimal 8 karakter.');
    const okOld = oldPassword ? await argonVerify(user.passwordHash, oldPassword).catch(() => false) : false;
    if (!okOld) throw new UnauthorizedException('Kata sandi lama salah.');
    if (oldPassword === newPassword) throw new BadRequestException('Kata sandi baru harus berbeda dari yang lama.');
    const passwordHash = await argonHash(newPassword);
    await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } });
    // Cabut semua sesi lain (perangkat lain), sisakan sesi saat ini.
    await this.prisma.session.deleteMany({
      where: { userId: user.id, ...(currentToken ? { tokenHash: { not: sha256(currentToken) } } : {}) },
    });
    return { ok: true };
  }

  async enroll2fa(user: User): Promise<{ secret: string; otpauth: string }> {
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret, twoFactorEnabled: false } });
    return { secret, otpauth: authenticator.keyuri(user.username, 'RAF NAS', secret) };
  }

  async verify2fa(user: User, code: string): Promise<{ ok: boolean }> {
    const u = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!u?.twoFactorSecret) throw new BadRequestException('Belum ada enrolmen 2FA.');
    if (!authenticator.verify({ token: (code ?? '').replace(/\s/g, ''), secret: u.twoFactorSecret })) {
      throw new UnauthorizedException('Kode salah.');
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: true } });
    return { ok: true };
  }

  async disable2fa(user: User): Promise<{ ok: boolean }> {
    await this.prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
    return { ok: true };
  }

  publicUser(u: User): PublicUser {
    return {
      id: u.id,
      username: u.username,
      name: u.displayName,
      initials: initialsOf(u.displayName),
      isSuperuser: u.isSuperuser,
      mustChangePassword: u.mustChangePassword,
      twoFactorEnabled: u.twoFactorEnabled,
    };
  }
}
