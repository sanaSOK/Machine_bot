import { SetMetadata } from '@nestjs/common';

export enum AdminRole {
  SUPER_ADMIN = 1,
  ADMIN = 2,
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (AdminRole | number)[]) => SetMetadata(ROLES_KEY, roles);
