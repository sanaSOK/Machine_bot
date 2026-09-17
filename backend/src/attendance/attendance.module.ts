import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './attendance.entity';
import { User } from '../users/user.entity';
import { Department } from '../admin/department.entity';
import { Branch } from '../branches/branch.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { TelegramModule } from '../telegram/telegram.module';
import { AdminModule } from '../admin/admin.module';

import { WorksModule } from '../staffs/works.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance, User, Department, Branch]),
    TelegramModule,
    AdminModule,
    WorksModule,
  ],
  providers: [AttendanceService],
  controllers: [AttendanceController],
  exports: [AttendanceService],
})
export class AttendanceModule {}
