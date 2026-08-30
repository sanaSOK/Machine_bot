import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

export interface TelegramUserData {
  id: number | string;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findByTelegramId(telegramUserId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { telegram_user_id: telegramUserId },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async findOrCreateFromTelegram(telegramUser: TelegramUserData): Promise<User> {
    const telegramIdStr = String(telegramUser.id);
    let user = await this.findByTelegramId(telegramIdStr);

    if (!user) {
      user = this.userRepository.create({
        telegram_user_id: telegramIdStr,
        first_name: telegramUser.first_name || 'Telegram User',
        last_name: telegramUser.last_name || null,
        username: telegramUser.username || null,
        photo_url: telegramUser.photo_url || null,
        is_active: true,
      });
      return this.userRepository.save(user);
    }

    // Update profile info if changed
    let updated = false;
    if (telegramUser.first_name && user.first_name !== telegramUser.first_name) {
      user.first_name = telegramUser.first_name;
      updated = true;
    }
    if (telegramUser.last_name !== undefined && user.last_name !== telegramUser.last_name) {
      user.last_name = telegramUser.last_name || null;
      updated = true;
    }
    if (telegramUser.username !== undefined && user.username !== telegramUser.username) {
      user.username = telegramUser.username || null;
      updated = true;
    }
    if (telegramUser.photo_url !== undefined && user.photo_url !== telegramUser.photo_url) {
      user.photo_url = telegramUser.photo_url || null;
      updated = true;
    }

    if (updated) {
      return this.userRepository.save(user);
    }

    return user;
  }
}
