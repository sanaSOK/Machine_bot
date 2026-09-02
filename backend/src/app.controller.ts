import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getApiRoot() {
    return {
      status: 'ok',
      message: 'Telegram Attendance System API Server is Running',
      timestamp: new Date().toISOString(),
    };
  }
}
