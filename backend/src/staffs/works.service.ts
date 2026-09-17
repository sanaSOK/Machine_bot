import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Work } from './work.entity';
import { SettingsService } from '../admin/settings.service';

@Injectable()
export class WorksService {
  private readonly logger = new Logger(WorksService.name);

  constructor(
    @InjectRepository(Work)
    private readonly workRepository: Repository<Work>,
    private readonly settingsService: SettingsService,
  ) {}

  async ensureStaffWorkSchedule(
    staffId: number,
    departmentId: number,
    customSchedule?: {
      workStartTime?: string;
      workEndTime?: string;
      gracePeriodMinutes?: number;
    },
  ): Promise<Work> {
    if (!staffId || !departmentId) {
      return null as any;
    }

    const existing = await this.workRepository.findOne({
      where: { staff_id: staffId, department_id: departmentId },
    });

    if (existing) {
      if (customSchedule) {
        if (customSchedule.workStartTime !== undefined) existing.work_start_time = customSchedule.workStartTime;
        if (customSchedule.workEndTime !== undefined) existing.work_end_time = customSchedule.workEndTime;
        if (customSchedule.gracePeriodMinutes !== undefined) existing.grace_period_minutes = customSchedule.gracePeriodMinutes;
        return await this.workRepository.save(existing);
      }
      return existing;
    }

    const settings = this.settingsService.getSettings();
    const work = this.workRepository.create({
      staff_id: staffId,
      department_id: departmentId,
      work_start_time: customSchedule?.workStartTime || settings.workStartTime,
      work_end_time: customSchedule?.workEndTime || settings.workEndTime,
      grace_period_minutes: customSchedule?.gracePeriodMinutes ?? settings.gracePeriodMinutes,
    });

    const saved = await this.workRepository.save(work);
    this.logger.log(
      `Created work schedule for staff #${staffId} in dept #${departmentId}: ${saved.work_start_time} - ${saved.work_end_time} (grace: ${saved.grace_period_minutes}m)`,
    );
    return saved;
  }

  async getStaffWorkSchedule(staffId: number, departmentId?: number): Promise<Work | null> {
    const where: any = { staff_id: staffId };
    if (departmentId) {
      where.department_id = departmentId;
    }
    return await this.workRepository.findOne({ where, order: { id: 'DESC' } });
  }

  async getDepartmentWorkSchedules(departmentId: number): Promise<Work[]> {
    return await this.workRepository.find({
      where: { department_id: departmentId },
      relations: ['staff'],
    });
  }
}
