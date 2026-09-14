import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { verificationEmailTemplate } from './templates/verification-email.template';
import { getMailConfig, MailConfig } from './config/mail.config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly mailConfig: MailConfig;

  constructor(private readonly configService: ConfigService) {
    this.mailConfig = getMailConfig(this.configService);

    this.transporter = nodemailer.createTransport({
      host: this.mailConfig.host,
      port: this.mailConfig.port,
      secure: this.mailConfig.secure,
      auth: {
        user: this.mailConfig.user,
        pass: this.mailConfig.pass,
      },
    });
  }

  async sendVerificationEmail(to: string, rawToken: string): Promise<void> {
    const { appUrl, appName, expiresInMinutes, fromName, fromAddress } = this.mailConfig;
    const verificationLink = `${appUrl}/api/auth/verify-email?token=${rawToken}`;

    const html = verificationEmailTemplate({
      verificationLink,
      expiresInMinutes,
      appName,
    });

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to,
        subject: 'Confirm your email address',
        html,
      });
    } catch (error: any) {
      this.logger.error(`Failed to send verification email to ${to}: ${error.message}`);
    }
  }
}
