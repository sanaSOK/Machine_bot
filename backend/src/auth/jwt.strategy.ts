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
import { AdminRole } from '../common/decorators/roles.decorator';
import { getJwtConfig } from './config/jwt.config';

export interface JwtPayload {
  sub: number;
  type?: 'admin' | 'staff';
  email?: string;
  role?: number;
  branch_id?: number | null;
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
        relations: ['branch'],
      });
      if (!admin || admin.is_active !== AccountStatus.ACTIVE) {
        throw new UnauthorizedException('Admin account is inactive');
      }
      if (admin.role === AdminRole.ADMIN && admin.branch && admin.branch.is_active !== 1) {
        throw new UnauthorizedException('Assigned branch has been deactivated');
      }
      (admin as any).accountType = 'admin';
      return admin;
    }

    // Default to Staff Telegram user
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.is_active) {
      throw new UnauthorizedException('Staff account is inactive or non-existent');
    }
    (user as any).accountType = 'staff';
    return user;
  }
}
