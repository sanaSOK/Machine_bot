import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Telegram authentication successed')
  async authenticateTelegram(@Body() dto: TelegramAuthDto) {
    return this.authService.validateTelegramAuth(dto.initData);
  }

  // login: super-admin/admin
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Login successed')
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.validateAdminLogin(dto);
  }

  // verify email
  @Get('verify-email')
  @ResponseMessage('Email verified successed')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  // resend verification link
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Verification link resent successed')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationLink(dto.email);
  }
}
