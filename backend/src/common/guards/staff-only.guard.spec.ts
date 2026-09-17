import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { StaffOnlyGuard } from './staff-only.guard';

describe('StaffOnlyGuard', () => {
  let guard: StaffOnlyGuard;

  beforeEach(() => {
    guard = new StaffOnlyGuard();
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  it('should allow access for Staff user (accountType = "staff")', () => {
    const context = createMockContext({ id: 1, accountType: 'staff' });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user has accountType = "admin"', () => {
    const context = createMockContext({ id: 1, accountType: 'admin' });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if user is not authenticated', () => {
    const context = createMockContext(null);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
