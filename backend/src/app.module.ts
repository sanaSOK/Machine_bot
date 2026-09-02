import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';

import { User } from './users/user.entity';
import { Attendance } from './attendance/attendance.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TelegramModule } from './telegram/telegram.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: parseInt(configService.get<string>('DB_PORT') || '3306', 10),
        username: configService.get<string>('DB_USERNAME') || 'root',
        password: configService.get<string>('DB_PASSWORD') || '1234',
        database: configService.get<string>('DB_DATABASE') || 'telegram_app',
        entities: [User, Attendance],
        synchronize: true,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot(
      {
        rootPath: path.join(process.cwd(), 'uploads'),
        serveRoot: '/uploads',
      },
      {
        rootPath: path.join(process.cwd(), '..', 'frontend', 'dist'),
        exclude: ['/api/(.*)'],
      },
    ),
    AuthModule,
    UsersModule,
    AttendanceModule,
    TelegramModule,
    AdminModule,
  ],
})
export class AppModule {}
