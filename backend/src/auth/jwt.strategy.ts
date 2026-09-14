import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { AdminUser } from '../users/admin-user.entity';
import { AccountStatus } from '../common/enums/account-status.enum';
import { getJwtConfig } from './config/jwt.config';

export interface JwtPayload {
  sub: number;
  type?: 'admin' | 'staff';
  email?: string;
  role?: number;
  telegram_user_id?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {
    const jwtConfig = getJwtConfig(configService);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<User | AdminUser> {
    if (payload.type === 'admin') {
      const admin = await this.adminUserRepository.findOne({
        where: { id: payload.sub },
      });
      if (!admin || admin.is_active !== AccountStatus.ACTIVE) {
        throw new UnauthorizedException('Admin account is inactive');
      }
      return admin;
    }

    // Default to Staff Telegram user
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Staff account is inactive or non-existent');
    }
    return user;
  }
}
