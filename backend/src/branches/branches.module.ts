import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Branch } from './branch.entity';
import { AdminUser } from '../users/admin-user.entity';
import { User } from '../users/user.entity';
import { Department } from '../admin/department.entity';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Branch, AdminUser, User, Department]),
  ],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService, TypeOrmModule],
})
export class BranchesModule {}
