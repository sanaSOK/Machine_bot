import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class StaffOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Access denied: Authentication context missing');
    }

    if ((user as any).accountType === 'admin') {
      throw new ForbiddenException(
        'Access denied: Attendance check-in and check-out is restricted to Staff accounts only.',
      );
    }

    return true;
  }
}
