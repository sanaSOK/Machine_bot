import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ReportsService } from './reports.service';

@Injectable()
export class DailySummaryScheduler {
  private readonly logger = new Logger(DailySummaryScheduler.name);

  constructor(private readonly reportsService: ReportsService) {}

  @Cron('0 16 * * *', { timeZone: 'Asia/Phnom_Penh' })
  async handleDailySummaryCron() {
    this.logger.log('⏰ Executing Daily Attendance Summary Cron job...');
    try {
      const success = await this.reportsService.sendDailySummaryReport();
      if (success) {
        this.logger.log('✅ Daily Attendance Summary Digest successfully posted to Telegram!');
      } else {
        this.logger.warn('⚠️ Daily Summary Digest could not be posted (check bot token / chat ID).');
      }
    } catch (error: any) {
      this.logger.error(`❌ Error in Daily Summary Cron job: ${error.message}`);
    }
  }
}
