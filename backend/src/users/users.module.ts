import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Department } from '../admin/department.entity';
import { UsersService } from './users.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Department]), TelegramModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
