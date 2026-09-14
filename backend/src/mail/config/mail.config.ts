import { ConfigService } from '@nestjs/config';

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromAddress: string;
  appUrl: string;
  appName: string;
  expiresInMinutes: number;
}

export const getMailConfig = (configService?: ConfigService): MailConfig => {
  const get = (key: string, defaultValue = ''): string => {
    if (configService) {
      return configService.get<string>(key) || defaultValue;
    }
    return process.env[key] || defaultValue;
  };

  const port = Number(get('EMAIL_PORT', '587')) || 587;
  const user = get('EMAIL_USER');
  const pass = get('EMAIL_PASS');

  return {
    host: get('EMAIL_HOST', 'smtp.gmail.com'),
    port,
    secure: port === 465,
    user,
    pass,
    fromName: get('EMAIL_FROM_NAME', 'eRoxiiAttendance'),
    fromAddress: get('EMAIL_FROM_ADDRESS', user || 'noreply@example.com'),
    appUrl: get('APP_URL') || get('FRONTEND_URL', 'http://localhost:3000'),
    appName: get('APP_NAME', 'eRoxii Attendance'),
    expiresInMinutes: Number(get('EMAIL_VERIFICATION_EXPIRES_MINUTES', '15')) || 15,
  };
};
