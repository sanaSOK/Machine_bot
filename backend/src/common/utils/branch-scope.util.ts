import { ForbiddenException } from '@nestjs/common';
import { AdminRole } from '../decorators/roles.decorator';
import { AdminUser } from '../../users/admin-user.entity';

/**
 * Resolves and enforces the branch scope for any administrative request.
 * - Admin (role 2): strictly restricted to their own branch_id.
 *   Throws ForbiddenException if attempting to access another branch.
 * - Super-Admin (role 1): can view all branches (returns null) or
 *   optionally filter down to a specific requested branch.
 */
export function resolveBranchScope(
  user: AdminUser | any,
  requestedBranchId?: number | string | null,
): number | null {
  if (!user) {
    throw new ForbiddenException('User context is missing');
  }

  const role = Number(user.role);

  if (role === AdminRole.ADMIN) {
    if (!user.branch_id) {
      throw new ForbiddenException('Your account has no branch assigned. Please contact a Super-Admin.');
    }
    const adminBranchId = Number(user.branch_id);

    if (requestedBranchId !== undefined && requestedBranchId !== null && requestedBranchId !== '') {
      const parsedReqBranchId = Number(requestedBranchId);
      if (!isNaN(parsedReqBranchId) && parsedReqBranchId !== adminBranchId) {
        throw new ForbiddenException('Access denied: You cannot access or modify data outside your assigned branch.');
      }
    }

    return adminBranchId;
  }

  // Super-Admin
  if (requestedBranchId !== undefined && requestedBranchId !== null && requestedBranchId !== '') {
    const parsedReqBranchId = Number(requestedBranchId);
    if (!isNaN(parsedReqBranchId)) {
      return parsedReqBranchId;
    }
  }

  return null;
}
