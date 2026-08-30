import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TelegramService } from '../telegram/telegram.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateTelegramAuth(initData: string): Promise<{ accessToken: string; user: User }> {
    // Validate signature and parse initData payload
    const validated = this.telegramService.validateInitData(initData);

    // Find or create user in MySQL
    const user = await this.usersService.findOrCreateFromTelegram(validated.user);

    // Generate JWT access token
    const payload = { sub: user.id, telegram_user_id: user.telegram_user_id };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }
}
