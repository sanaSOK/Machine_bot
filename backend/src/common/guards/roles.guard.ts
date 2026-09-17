import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, AdminRole } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(AdminRole | number)[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role === undefined || (user as any).accountType === 'staff') {
      throw new ForbiddenException('Access denied: Admin privileges required');
    }

    const hasRole = requiredRoles.some((role) => Number(user.role) === Number(role));
    if (!hasRole) {
      throw new ForbiddenException('Access denied: Insufficient permissions for this action');
    }

    return true;
  }
}
