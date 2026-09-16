import { Injectable, OnModuleInit } from '@nestjs/common';
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
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly telegramService: TelegramService,
  ) {}

  async syncAllTelegramUsernames() {
    try {
      const users = await this.userRepository.find();
      for (const user of users) {
        if (!user.telegram_user_id) continue;
        const info = await this.telegramService.getTelegramChatInfo(user.telegram_user_id);
        if (info && info.username !== undefined && user.username !== info.username) {
          user.username = info.username || null;
          if (info.first_name) {
            const fullName = [info.first_name, info.last_name].filter(Boolean).join(' ');
            if (fullName) user.first_name = fullName;
          }
          await this.userRepository.save(user);
        }
      }
    } catch (e) {
      // Ignore background sync error
    }
  }

  async onModuleInit() {
    try {
      // Clean up any legacy 'no_username' strings across all users in DB so missing usernames are set to null
      const legacyUsers = await this.userRepository.find({ where: { username: 'no_username' } });
      for (const u of legacyUsers) {
        u.username = null;
        await this.userRepository.save(u);
      }
      await this.syncAllTelegramUsernames();
    } catch (e) {
      // Ignore initial DB cleanup warning
    }
  }

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
    return user;
  }

  async findOrCreateFromTelegram(telegramUser: TelegramUserData): Promise<User> {
    const telegramIdStr = String(telegramUser.id);
    let user = await this.findByTelegramId(telegramIdStr);

    let photoUrl = telegramUser.photo_url || null;
    if (!photoUrl) {
      photoUrl = await this.telegramService.getUserProfilePhotoUrl(telegramIdStr);
    }

    const fullName = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || 'Telegram User';

    const telegramUsername = telegramUser.username ? telegramUser.username.trim().replace(/^@/, '') : null;

    if (!user) {
      user = this.userRepository.create({
        telegram_user_id: telegramIdStr,
        first_name: fullName,
        username: telegramUsername,
        photo_url: photoUrl,
        department_id: 1,
        role: 1,
        is_active: true,
      });
      return this.userRepository.save(user);
    }

    // Update profile info dynamically for EVERY Telegram user whenever they open app / check-in
    let updated = false;
    if (fullName && user.first_name !== fullName) {
      user.first_name = fullName;
      updated = true;
    }
    if (telegramUsername !== undefined && user.username !== telegramUsername) {
      user.username = telegramUsername;
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
