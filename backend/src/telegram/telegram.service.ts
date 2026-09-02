import { Injectable, UnauthorizedException, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface ValidatedTelegramAuth {
  user: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
  };
  auth_date: number;
  hash: string;
  query_id?: string;
}

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private isPolling = false;
  private updateOffset = 0;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (botToken && !botToken.startsWith('123456789:ABC')) {
      this.logger.log('🤖 Telegram Bot Token detected. Initializing bot menu button & polling...');
      await this.configureMenuButton();
      this.startPolling();
    }
  }

  onModuleDestroy() {
    this.isPolling = false;
  }

  /**
   * Reads FRONTEND_URL dynamically from .env or ConfigService
   */
  public getFrontendUrl(): string {
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/FRONTEND_URL=(.*)/);
        if (match && match[1] && match[1].trim()) {
          return match[1].trim();
        }
      }
    } catch (e) {
      // fallback to configService
    }
    return this.configService.get<string>('FRONTEND_URL') || 'https://grand-traveler-linked-species.trycloudflare.com';
  }

  /**
   * Start long polling loop to receive incoming Telegram user messages (e.g. /start)
   */
  private async startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.logger.log('📡 Telegram Bot live polling active. Listening for /start messages...');

    while (this.isPolling) {
      try {
        const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
        if (!botToken || !this.isPolling) break;

        const response = await fetch(
          `https://api.telegram.org/bot${botToken}/getUpdates?offset=${this.updateOffset}&timeout=10`,
        );
        const data = (await response.json()) as any;

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            this.updateOffset = update.update_id + 1;
            await this.handleWebhookUpdate(update);
          }
        }
      } catch (error: any) {
        if (!this.isPolling) break;
        if (error.message !== 'fetch failed') {
          this.logger.warn(`Telegram polling retry: ${error.message}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  /**
   * Validates Telegram WebApp initData query string using Telegram HMAC-SHA256 algorithm.
   */
  validateInitData(initData: string): ValidatedTelegramAuth {
    if (!initData || typeof initData !== 'string') {
      throw new UnauthorizedException('Missing or invalid Telegram initData');
    }

    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not configured');
      throw new UnauthorizedException('Server bot token configuration error');
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');

    if (!hash) {
      throw new UnauthorizedException('Telegram initData does not contain hash');
    }

    // Allow dev mock hash for browser testing outside Telegram
    if (hash === 'dev_mock_hash_for_testing') {
      const userJson = params.get('user');
      const user = userJson
        ? JSON.parse(userJson)
        : { id: 123456789, first_name: 'Alex', last_name: 'Employee', username: 'alex_employee' };
      return {
        user,
        auth_date: Math.floor(Date.now() / 1000),
        hash,
        query_id: 'AAH_DEMO_123',
      };
    }

    params.delete('hash');

    const dataCheckArr: string[] = [];
    params.forEach((value, key) => {
      dataCheckArr.push(`${key}=${value}`);
    });

    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    // Secret key generation: HMAC-SHA256("WebAppData", botToken)
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate hash: HMAC-SHA256(dataCheckString, secretKey)
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash.toLowerCase() !== hash.toLowerCase()) {
      throw new UnauthorizedException('Invalid Telegram initData signature');
    }

    const authDateStr = params.get('auth_date');
    if (authDateStr) {
      const authDate = parseInt(authDateStr, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const maxAge = 86400 * 7;
      if (currentTime - authDate > maxAge) {
        throw new UnauthorizedException('Telegram initData signature expired');
      }
    }

    const userJson = params.get('user');
    if (!userJson) {
      throw new UnauthorizedException('Telegram initData user field is missing');
    }

    try {
      const user = JSON.parse(userJson);
      return {
        user,
        auth_date: authDateStr ? parseInt(authDateStr, 10) : 0,
        hash,
        query_id: params.get('query_id') || undefined,
      };
    } catch (err) {
      throw new UnauthorizedException('Failed to parse Telegram user JSON payload');
    }
  }

  /**
   * Automatically configures Telegram Bot Menu Button to open Mini App URL via Telegram API
   */
  async configureMenuButton(): Promise<boolean> {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    const frontendUrl = this.getFrontendUrl();

    if (!botToken) return false;

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/setChatMenuButton`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_button: {
            type: 'web_app',
            text: '📱 Open Attendance',
            web_app: { url: frontendUrl },
          },
        }),
      });

      const resData = (await response.json()) as any;
      if (resData.ok) {
        this.logger.log(`✅ Successfully configured Telegram Bot Menu Button -> ${frontendUrl}`);
        return true;
      } else {
        this.logger.warn(`⚠️ Telegram setChatMenuButton warning: ${resData.description}`);
        return false;
      }
    } catch (error: any) {
      this.logger.error(`❌ Failed to set Telegram menu button: ${error.message}`);
      return false;
    }
  }

  /**
   * Send text message with inline button directly to Telegram user
   */
  async sendMessage(chatId: string | number, text: string, replyMarkup?: any): Promise<any> {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is not configured');

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });

    return response.json();
  }

  /**
   * Send photo with HTML formatted caption to Telegram user / admin group via Telegram Bot API
   */
  async sendAttendancePhotoNotification(
    chatId: string | number,
    filePath: string,
    caption: string,
  ): Promise<any> {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) return null;

    try {
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`Photo file not found on disk: ${filePath}`);
        return null;
      }

      const fileBuffer = fs.readFileSync(filePath);
      const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });
      const filename = path.basename(filePath);

      const formData = new FormData();
      formData.append('chat_id', String(chatId));
      formData.append('photo', fileBlob, filename);
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');

      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as any;
      if (!result.ok) {
        this.logger.warn(`Telegram sendPhoto warning for chatId ${chatId}: ${result.description || JSON.stringify(result)}`);
      } else {
        this.logger.log(`📸 Successfully sent Telegram attendance photo to chatId ${chatId}`);
      }
      return result;
    } catch (error: any) {
      this.logger.error(`❌ Failed to send photo notification: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch Telegram user profile photo direct CDN URL using Telegram Bot API
   */
  async getUserProfilePhotoUrl(telegramUserId: string | number): Promise<string | null> {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken || !telegramUserId) return null;

    try {
      // 1. Fetch user profile photos list
      const res1 = await fetch(
        `https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${telegramUserId}&limit=1`,
      );
      const data1 = (await res1.json()) as any;
      if (!data1.ok || !data1.result?.photos?.[0]?.[0]?.file_id) {
        return null;
      }

      const fileId = data1.result.photos[0][0].file_id;

      // 2. Fetch file path from file_id
      const res2 = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
      const data2 = (await res2.json()) as any;
      if (!data2.ok || !data2.result?.file_path) {
        return null;
      }

      const filePath = data2.result.file_path;

      // 3. Return full public Telegram CDN photo URL
      return `https://api.telegram.org/file/bot${botToken}/${filePath}`;
    } catch (e) {
      this.logger.warn(`Failed to fetch user profile photo for ${telegramUserId}: ${e}`);
      return null;
    }
  }

  /**
   * Process incoming Telegram bot update (e.g. /start command)
   */
  async handleWebhookUpdate(update: any) {
    if (!update) return { status: 'ignored' };

    const message = update.message || update.channel_post || update.edited_message;
    if (!message) return { status: 'ignored' };

    const chatId = message.chat?.id;
    const chatTitle = message.chat?.title || message.chat?.first_name || 'Group';
    const threadId = message.message_thread_id;
    const text = message.text || '';
    const frontendUrl = this.getFrontendUrl();

    if (chatId) {
      this.logger.log(`📩 Chat Event -> Title: "${chatTitle}" | Chat ID: ${chatId} ${threadId ? '| Topic Thread ID: ' + threadId : ''} | Text: "${text}"`);
    }

    if (text.startsWith('/id')) {
      let idText = `<b>🆔 Telegram Chat Info</b>\n\n<b>Chat Title:</b> ${chatTitle}\n<b>Chat ID:</b> <code>${chatId}</code>`;
      if (threadId) {
        idText += `\n<b>Topic Thread ID:</b> <code>${threadId}</code>\n\n<b>Format for .env:</b> <code>${chatId}:${threadId}</code>`;
      } else {
        idText += `\n\n<b>Format for .env:</b> <code>${chatId}</code>`;
      }
      await this.sendMessage(chatId, idText);
      return { status: 'sent_id' };
    }

    if (text.startsWith('/start') || text.toLowerCase().includes('attendance')) {
      const welcomeText = `<b>👋 Welcome to Telegram Attendance System</b>\n\nEmployee identification, check-in, check-out, and camera verification system.\n\nPlease click below to open the attendance mini app:`;

      const inlineKeyboard = {
        inline_keyboard: [
          [
            {
              text: '📱 Open Attendance System',
              web_app: { url: frontendUrl },
            },
          ],
        ],
      };

      await this.sendMessage(chatId, welcomeText, inlineKeyboard);
      return { status: 'sent_welcome' };
    }

    return { status: 'processed' };
  }

  getBotWelcomeInfo() {
    const frontendUrl = this.getFrontendUrl();
    return {
      message: '👋 Welcome to Attendance System\n\nPlease open the attendance system below:',
      menuButton: {
        text: '📱 Open Attendance',
        web_app: { url: frontendUrl },
      },
    };
  }
}
