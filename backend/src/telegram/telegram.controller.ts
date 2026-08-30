import { Controller, Get, Post, Body } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get('bot-config')
  getBotConfig() {
    return this.telegramService.getBotWelcomeInfo();
  }

  @Post('set-menu-button')
  async configureMenuButton() {
    const success = await this.telegramService.configureMenuButton();
    return { success, message: success ? 'Bot menu button configured!' : 'Failed to configure menu button' };
  }

  @Post('webhook')
  async handleWebhook(@Body() update: any) {
    return this.telegramService.handleWebhookUpdate(update);
  }
}
