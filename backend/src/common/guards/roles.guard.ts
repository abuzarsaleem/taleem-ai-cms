import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../decorators/current-user.decorator';
import { BusinessException } from '../exceptions';
import { HttpStatus } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user) {
      throw new BusinessException('Unauthorized', HttpStatus.UNAUTHORIZED, 'UNAUTHORIZED');
    }

    const allowed = requiredRoles.includes(user.role as UserRole);
    if (!allowed) {
      throw new BusinessException(
        'Admin role required',
        HttpStatus.FORBIDDEN,
        'FORBIDDEN',
      );
    }

    return true;
  }
}
