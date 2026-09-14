import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { AdminRole } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockContext({ role: 2 });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required SUPER_ADMIN role (1)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([AdminRole.SUPER_ADMIN]);
    const context = createMockContext({ role: 1 });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user has ADMIN role (2) when SUPER_ADMIN is required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([AdminRole.SUPER_ADMIN]);
    const context = createMockContext({ role: 2 });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user has no role property', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([AdminRole.SUPER_ADMIN]);
    const context = createMockContext({});
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
