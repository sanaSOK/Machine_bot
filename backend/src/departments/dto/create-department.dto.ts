import { IsString, IsOptional, IsNotEmpty, MaxLength, Matches } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty({ message: 'Department name is required' })
  @MaxLength(128, { message: 'Department name must be at most 128 characters' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Color must be a valid hex color (e.g. #6366f1)' })
  color?: string;

  @IsOptional()
  branch_id?: number;
}
