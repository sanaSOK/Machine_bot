import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { TelegramService } from './telegram.service';

describe('TelegramService', () => {
  let service: TelegramService;
  const mockBotToken = '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'TELEGRAM_BOT_TOKEN') return mockBotToken;
              if (key === 'FRONTEND_URL') return 'http://localhost:5173';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should validate valid Telegram initData signature', () => {
    const userObj = {
      id: 987654321,
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe',
    };
    const authDate = Math.floor(Date.now() / 1000);
    const userStr = JSON.stringify(userObj);

    // Build data_check_string
    const params = new Map<string, string>();
    params.set('auth_date', authDate.toString());
    params.set('query_id', 'AAH12345');
    params.set('user', userStr);

    const dataCheckArr: string[] = [];
    params.forEach((val, key) => dataCheckArr.push(`${key}=${val}`));
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    // Generate valid hash
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(mockBotToken).digest();
    const validHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const initDataQuery = `auth_date=${authDate}&query_id=AAH12345&user=${encodeURIComponent(userStr)}&hash=${validHash}`;

    const result = service.validateInitData(initDataQuery);
    expect(result).toBeDefined();
    expect(result.user.id).toBe(987654321);
    expect(result.user.first_name).toBe('John');
    expect(result.user.username).toBe('johndoe');
  });

  it('should throw UnauthorizedException on invalid hash', () => {
    const invalidInitData = 'auth_date=1690000000&user=%7B%22id%22%3A123%7D&hash=invalidhash123';
    expect(() => service.validateInitData(invalidInitData)).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when hash is missing', () => {
    const noHashInitData = 'auth_date=1690000000&user=%7B%22id%22%3A123%7D';
    expect(() => service.validateInitData(noHashInitData)).toThrow(UnauthorizedException);
  });
});
