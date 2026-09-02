import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceAction } from './attendance.entity';
import { User } from '../users/user.entity';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let repositoryMock: any;
  let userRepositoryMock: any;

  const mockUser: User = {
    id: 1,
    telegram_user_id: '987654321',
    first_name: 'Jane',
    last_name: 'Doe',
    username: 'janedoe',
    photo_url: null,
    address: 'Phnom Penh, Cambodia',
    is_active: true,
    role: 'EMPLOYEE',
    created_at: new Date(),
    updated_at: new Date(),
    attendances: [],
  };

  const mockMulterFile: Express.Multer.File = {
    fieldname: 'photo',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    destination: 'uploads/attendance/2026/08',
    filename: 'photo-123.jpg',
    path: 'uploads/attendance/2026/08/photo-123.jpg',
    buffer: Buffer.from(''),
    stream: null as any,
  };

  beforeEach(async () => {
    repositoryMock = {
      find: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: 1, created_at: new Date(), ...entity })),
    };

    userRepositoryMock = {
      save: jest.fn((user) => Promise.resolve(user)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getRepositoryToken(Attendance),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  it('should allow check-in when user has no attendance today', async () => {
    repositoryMock.find.mockResolvedValue([]);

    const result = await service.checkIn(mockUser, mockMulterFile, { latitude: 11.5564, longitude: 104.9282, address: 'Phnom Penh, Cambodia' });
    expect(result).toBeDefined();
    expect(result.action).toBe(AttendanceAction.CHECK_IN);
    expect(repositoryMock.save).toHaveBeenCalled();
  });

  it('should allow re-check-in to update check-in time to current live time', async () => {
    repositoryMock.find.mockResolvedValue([
      {
        id: 1,
        user_id: 1,
        action: AttendanceAction.CHECK_IN,
        created_at: new Date(),
      },
    ]);

    const result = await service.checkIn(mockUser, mockMulterFile, { latitude: 11.5564, longitude: 104.9282, address: 'Phnom Penh, Cambodia' });
    expect(result).toBeDefined();
    expect(result.action).toBe(AttendanceAction.CHECK_IN);
    expect(repositoryMock.save).toHaveBeenCalled();
  });

  it('should allow check-out after check-in', async () => {
    repositoryMock.find.mockResolvedValue([
      {
        id: 1,
        user_id: 1,
        action: AttendanceAction.CHECK_IN,
        created_at: new Date(),
      },
    ]);

    const result = await service.checkOut(mockUser, mockMulterFile, { latitude: 11.5564, longitude: 104.9282, address: 'Phnom Penh, Cambodia' });
    expect(result).toBeDefined();
    expect(result.action).toBe(AttendanceAction.CHECK_OUT);
  });

  it('should throw BadRequestException when user tries to check-out without checking in first', async () => {
    repositoryMock.find.mockResolvedValue([]);

    await expect(
      service.checkOut(mockUser, mockMulterFile, { latitude: 11.5564, longitude: 104.9282 }),
    ).rejects.toThrow(BadRequestException);
  });
});
