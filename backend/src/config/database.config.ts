import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as path from 'path';

// Centrally import all entities so they don't have to be re-listed everywhere
import { User } from '../users/user.entity';
import { AdminUser } from '../users/admin-user.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Department } from '../admin/department.entity';
import { Work } from '../staffs/work.entity';
import { Branch } from '../branches/branch.entity';

export const ALL_ENTITIES = [
  User,
  AdminUser,
  Attendance,
  Department,
  Work,
  Branch,
];

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.getOrThrow<string>('DB_HOST'),
  port: configService.getOrThrow<number>('DB_PORT'),
  username: configService.getOrThrow<string>('DB_USERNAME'),
  password: configService.getOrThrow<string>('DB_PASSWORD'),
  database: configService.getOrThrow<string>('DB_DATABASE'),
  entities: ALL_ENTITIES,
  synchronize: true,  // NOTE: keep true for local dev — set false before production deploy
  logging: ['error'],
  charset: 'utf8mb4',
  timezone: 'local',
});
