import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import * as fs from 'fs';

import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TelegramModule } from './telegram/telegram.module';
import { AdminModule } from './admin/admin.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { ProfileModule } from './profile/profile.module';
import { MailModule } from './mail/mail.module';
import { BranchesModule } from './branches/branches.module';
import { DepartmentsModule } from './departments/departments.module';
import { WorksModule } from './staffs/works.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),

    DatabaseModule,

    ScheduleModule.forRoot(),
    ServeStaticModule.forRootAsync({
      useFactory: () => {
        const configs: any[] = [
          {
            rootPath: path.join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
            serveStaticOptions: { fallthrough: false },
          },
        ];
        const frontendDistPath = path.join(process.cwd(), '..', 'frontend', 'dist');
        if (fs.existsSync(frontendDistPath)) {
          configs.push({
            rootPath: frontendDistPath,
            exclude: ['/api/(.*)'],
          });
        }
        return configs;
      },
    }),

    AuthModule,
    UsersModule,
    AttendanceModule,
    TelegramModule,
    AdminModule,
    SuperAdminModule,
    BranchesModule,
    DepartmentsModule,
    WorksModule,
    ProfileModule,
    MailModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
