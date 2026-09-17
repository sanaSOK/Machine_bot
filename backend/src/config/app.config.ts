import { ConfigService } from '@nestjs/config';

export interface AppConfig {
  port: number;
  frontendUrl: string;
  corsOrigins: string[];
}

export const getAppConfig = (configService: ConfigService): AppConfig => {
  const frontendUrl = configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

  return {
    port: configService.get<number>('PORT') || 3000,
    frontendUrl,
    corsOrigins: [
      frontendUrl,
      'http://localhost:5173',
      'https://telegram.org',
    ],
  };
};
