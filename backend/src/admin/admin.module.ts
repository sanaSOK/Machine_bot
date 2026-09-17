import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SettingsService } from './settings.service';
import { ReportsService } from './reports.service';
import { DailySummaryScheduler } from './daily-summary.scheduler';
import { User } from '../users/user.entity';
import { Attendance } from '../attendance/attendance.entity';
import { TelegramModule } from '../telegram/telegram.module';
import { DepartmentsModule } from '../departments/departments.module';
import { WorksModule } from '../staffs/works.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Attendance]),
    TelegramModule,
    DepartmentsModule,
    WorksModule,
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    SettingsService,
    ReportsService,
    DailySummaryScheduler,
  ],
  exports: [AdminService, SettingsService, ReportsService],
})
export class AdminModule {}
