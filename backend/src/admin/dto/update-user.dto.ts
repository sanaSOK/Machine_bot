import { IsOptional, IsString, IsBoolean, IsInt } from 'class-validator';
import { ToOptionalNumber } from './branch-query.dto';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @ToOptionalNumber()
  @IsInt()
  branch_id?: number;
}
