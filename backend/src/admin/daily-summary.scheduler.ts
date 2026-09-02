import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AdminService } from './admin.service';

@Injectable()
export class DailySummaryScheduler {
  private readonly logger = new Logger(DailySummaryScheduler.name);

  constructor(private readonly adminService: AdminService) {}

  /**
   * Automatically runs every day at 18:00 (6:00 PM) to post Daily Summary Digest to Telegram Topic 10 (# Daily_Summary)
   */
  @Cron('0 18 * * *')
  async handleDailySummaryCron() {
    this.logger.log('⏰ Executing Daily Attendance Summary Cron job at 18:00...');
    try {
      const success = await this.adminService.sendDailySummaryReport();
      if (success) {
        this.logger.log('✅ Daily Attendance Summary Digest successfully posted to Telegram!');
      } else {
        this.logger.warn('⚠️ Daily Attendance Summary Digest could not be posted (check bot settings or chat ID).');
      }
    } catch (error: any) {
      this.logger.error(`❌ Error in Daily Summary Cron job: ${error.message}`);
    }
  }
}
