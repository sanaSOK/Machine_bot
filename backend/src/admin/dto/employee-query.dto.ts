import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ToOptionalNumber, ToOptionalString } from './branch-query.dto';

export class AdminEmployeeQueryDto {
  @IsOptional()
  @ToOptionalString()
  @IsString()
  search?: string;

  @IsOptional()
  @ToOptionalString()
  @IsString()
  department?: string;

  @IsOptional()
  @ToOptionalString()
  @IsString()
  role?: string;

  @IsOptional()
  @ToOptionalNumber()
  @IsInt()
  @Min(1)
  limit?: number = 10;

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
