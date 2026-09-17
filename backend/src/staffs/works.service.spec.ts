import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorksService } from './works.service';
import { Work } from './work.entity';
import { SettingsService } from '../admin/settings.service';

describe('WorksService', () => {
  let service: WorksService;
  let workRepoMock: any;
  let settingsServiceMock: any;

  beforeEach(async () => {
    workRepoMock = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 1, ...entity })),
      find: jest.fn(),
    };

    settingsServiceMock = {
      getSettings: jest.fn().mockReturnValue({
        workStartTime: '08:00',
        workEndTime: '17:00',
        gracePeriodMinutes: 15,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorksService,
        {
          provide: getRepositoryToken(Work),
          useValue: workRepoMock,
        },
        {
          provide: SettingsService,
          useValue: settingsServiceMock,
        },
      ],
    }).compile();

    service = module.get<WorksService>(WorksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a work schedule if not exists', async () => {
    workRepoMock.findOne.mockResolvedValue(null);

    const result = await service.ensureStaffWorkSchedule(1, 1);

    expect(workRepoMock.create).toHaveBeenCalledWith({
      staff_id: 1,
      department_id: 1,
      work_start_time: '08:00',
      work_end_time: '17:00',
      grace_period_minutes: 15,
    });
    expect(workRepoMock.save).toHaveBeenCalled();
    expect(result.work_start_time).toBe('08:00');
    expect(result.work_end_time).toBe('17:00');
  });

  it('should return existing work schedule if already exists', async () => {
    const existingWork = {
      id: 5,
      staff_id: 2,
      department_id: 3,
      work_start_time: '09:00',
      work_end_time: '18:00',
      grace_period_minutes: 10,
    };
    workRepoMock.findOne.mockResolvedValue(existingWork);

    const result = await service.ensureStaffWorkSchedule(2, 3);

    expect(workRepoMock.create).not.toHaveBeenCalled();
    expect(result).toBe(existingWork);
  });
});
