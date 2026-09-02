import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './attendance.entity';
import { User } from '../users/user.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { TelegramModule } from '../telegram/telegram.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, User]), TelegramModule, AdminModule],
  providers: [AttendanceService],
  controllers: [AttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}
