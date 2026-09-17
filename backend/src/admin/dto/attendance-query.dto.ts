import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { AttendanceAction } from '../../attendance/attendance.entity';
import { ToOptionalNumber, ToOptionalString } from './branch-query.dto';

export class AdminAttendanceQueryDto {
  @IsOptional()
  @ToOptionalString()
  @IsString()
  search?: string;

  @IsOptional()
  @ToOptionalString()
  @IsEnum(AttendanceAction)
  type?: 'CHECK_IN' | 'CHECK_OUT';

  @IsOptional()
  @ToOptionalString()
  @IsString()
  date?: string;

  @IsOptional()
  @ToOptionalString()
  @IsString()
  status?: string;

  @IsOptional()
  @ToOptionalNumber()
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @ToOptionalNumber()
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @IsOptional()
  @ToOptionalNumber()
  @IsInt()
  branch_id?: number;
}
