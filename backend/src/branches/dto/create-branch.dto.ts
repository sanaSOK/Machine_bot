import { IsNotEmpty, IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateBranchDto {
  @IsNotEmpty({ message: 'Branch name is required' })
  @IsString({ message: 'Branch name must be a string' })
  @MaxLength(100, { message: 'Branch name cannot exceed 100 characters' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @MaxLength(255, { message: 'Address cannot exceed 255 characters' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  @MaxLength(20, { message: 'Phone cannot exceed 20 characters' })
  phone?: string;
}
