import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_SETTINGS } from '../common/constants/app.constants';
import { DepartmentItem } from '../departments/departments.service';

export interface SystemSettings {
  companyName: string;
  logoUrl?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  isSuspended?: boolean;
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
  requireGps: boolean;
  requireDualPhoto: boolean;
  pageSize: number;
  telegramBotToken: string;
  telegramNotificationChatId?: string;
  departments?: DepartmentItem[];
}

/**
 * SettingsService — manages system-wide settings persisted to a JSON file.
 *
 * NOTE: JSON file persistence is intentional for local-dev simplicity.
 * In a cloud/multi-instance deployment, migrate these settings to the
 * `admin_organizations` DB table (entity already exists: AdminOrganization).
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);
  private readonly settingsPath = path.join(process.cwd(), 'uploads', 'system_settings.json');

  getSettings(): SystemSettings {
    const defaults: SystemSettings = {
      companyName: DEFAULT_SETTINGS.COMPANY_NAME,
      logoUrl: DEFAULT_SETTINGS.LOGO_URL,
      workStartTime: DEFAULT_SETTINGS.WORK_START,
      workEndTime: DEFAULT_SETTINGS.WORK_END,
      gracePeriodMinutes: DEFAULT_SETTINGS.GRACE_PERIOD_MINUTES,
      requireGps: DEFAULT_SETTINGS.REQUIRE_GPS,
      requireDualPhoto: DEFAULT_SETTINGS.REQUIRE_DUAL_PHOTO,
      pageSize: DEFAULT_SETTINGS.PAGE_SIZE,
      telegramBotToken: process.env.TELEGRAM_BOT_TOKEN
        ? `${process.env.TELEGRAM_BOT_TOKEN.slice(0, 10)}...`
        : 'Not Configured',
      telegramNotificationChatId: process.env.TELEGRAM_NOTIFICATION_CHAT_ID || '',
      departments: [],
    };

    try {
      if (fs.existsSync(this.settingsPath)) {
        const raw = fs.readFileSync(this.settingsPath, 'utf8');
        const parsed: Partial<SystemSettings> = JSON.parse(raw);
        return { ...defaults, ...parsed };
      }
    } catch (e) {
      this.logger.warn(`Failed to read system_settings.json: ${e?.message}`);
    }

    return defaults;
  }

  updateSettings(dto: Partial<SystemSettings>): SystemSettings {
    const current = this.getSettings();
    const updated = { ...current, ...dto };

    try {
      const dir = path.dirname(this.settingsPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.settingsPath, JSON.stringify(updated, null, 2), 'utf8');
    } catch (e) {
      this.logger.warn(`Failed to write system_settings.json: ${e?.message}`);
    }

    return updated;
  }

  updateLogo(file: Express.Multer.File): { logoUrl: string; message: string } {
    const logoUrl = `/uploads/${file.filename}?v=${Date.now()}`;
    this.updateSettings({ logoUrl });

    // Best-effort copy to frontend public directory (dev convenience)
    try {
      const publicDir = path.join(process.cwd(), '..', 'frontend', 'public');
      const publicPath = path.join(publicDir, 'logo.png');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.copyFileSync(file.path, publicPath);
    } catch (e) {
      this.logger.warn(`Copy logo to frontend/public failed (non-critical): ${e?.message}`);
    }

    return { logoUrl, message: 'Company logo uploaded and updated successfully' };
  }
}
