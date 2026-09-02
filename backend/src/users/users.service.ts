import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { TelegramService } from '../telegram/telegram.service';

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
    private readonly telegramService: TelegramService,
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

  async updateUserAddress(userId: number, address: string): Promise<User | null> {
    const user = await this.findById(userId);
    if (user && address) {
      user.address = address;
      return this.userRepository.save(user);
    }
    return user;
  }

  async findOrCreateFromTelegram(telegramUser: TelegramUserData): Promise<User> {
    const telegramIdStr = String(telegramUser.id);
    let user = await this.findByTelegramId(telegramIdStr);

    let photoUrl = telegramUser.photo_url || null;
    if (!photoUrl) {
      photoUrl = await this.telegramService.getUserProfilePhotoUrl(telegramIdStr);
    }

    if (!user) {
      user = this.userRepository.create({
        telegram_user_id: telegramIdStr,
        first_name: telegramUser.first_name || 'Telegram User',
        last_name: telegramUser.last_name || null,
        username: telegramUser.username || null,
        photo_url: photoUrl,
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
    if (photoUrl && user.photo_url !== photoUrl) {
      user.photo_url = photoUrl;
      updated = true;
    }

    if (updated) {
      return this.userRepository.save(user);
    }

    return user;
  }
}
