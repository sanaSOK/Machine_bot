import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Work } from './work.entity';
import { WorksService } from './works.service';
import { SettingsService } from '../admin/settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Work])],
  providers: [WorksService, SettingsService],
  exports: [WorksService, TypeOrmModule],
})
export class WorksModule {}
