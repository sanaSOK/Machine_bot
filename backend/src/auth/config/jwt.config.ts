import { ConfigService } from '@nestjs/config';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export const getJwtConfig = (configService?: ConfigService): JwtConfig => {
  const get = (key: string, defaultValue = ''): string => {
    if (configService) {
      return configService.get<string>(key) || defaultValue;
    }
    return process.env[key] || defaultValue;
  };

  return {
    secret: get('JWT_SECRET', 'super_secret_jwt_key_telegram_attendance_2026'),
    expiresIn: get('JWT_EXPIRES_IN', '7d'),
  };
};
