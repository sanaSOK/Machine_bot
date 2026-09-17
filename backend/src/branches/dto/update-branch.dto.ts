import { IsString, MaxLength, IsOptional, IsInt, Min, Max } from 'class-validator';

export class UpdateBranchDto {
  @IsOptional()
  @IsString({ message: 'Branch name must be a string' })
  @MaxLength(100, { message: 'Branch name cannot exceed 100 characters' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @MaxLength(255, { message: 'Address cannot exceed 255 characters' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(20, { message: 'Phone cannot exceed 20 characters' })
  phone?: string;

  @IsOptional()
  @IsInt({ message: 'is_active must be 0 or 1' })
  @Min(0)
  @Max(1)
  is_active?: number;
}
