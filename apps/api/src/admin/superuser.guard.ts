import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';

@Injectable()
export class SuperuserGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user?: User }>();
    if (!req.user || !req.user.isSuperuser) {
      throw new ForbiddenException('Hanya Admin IT yang boleh membuka halaman ini.');
    }
    return true;
  }
}
