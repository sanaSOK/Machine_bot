import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import * as path from 'path';
import * as fs from 'fs';

import { User } from './users/user.entity';
import { Attendance } from './attendance/attendance.entity';
import { Department } from './admin/department.entity';
import { AdminOrganization } from './super-admin/admin-organization.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TelegramModule } from './telegram/telegram.module';
import { AdminModule } from './admin/admin.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: parseInt(configService.get<string>('DB_PORT') || '3306', 10),
        username: configService.get<string>('DB_USERNAME') || 'root',
        password: configService.get<string>('DB_PASSWORD') || '1234',
        database: configService.get<string>('DB_DATABASE') || 'telegram_app',
        entities: [User, Attendance, Department],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      name: 'superAdminConnection',
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: parseInt(configService.get<string>('DB_PORT') || '3306', 10),
        username: configService.get<string>('DB_USERNAME') || 'root',
        password: configService.get<string>('DB_PASSWORD') || '1234',
        database: configService.get<string>('DB_SUPERADMIN_DATABASE') || 'super_admin_attendances_db',
        entities: [AdminOrganization],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRootAsync({
      useFactory: () => {
        const configs: any[] = [
          {
            rootPath: path.join(process.cwd(), 'uploads'),
            serveRoot: '/uploads',
            serveStaticOptions: {
              fallthrough: false,
            },
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
  ],
  controllers: [AppController],
})
export class AppModule {}
