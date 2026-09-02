import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DailySummaryScheduler } from './daily-summary.scheduler';
import { User } from '../users/user.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Department } from './department.entity';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Attendance, Department]), TelegramModule],
  controllers: [AdminController],
  providers: [AdminService, DailySummaryScheduler],
  exports: [AdminService],
})
export class AdminModule {}
