import { IsEmail, IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Full name must be a string' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  fullname?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address format' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email format (e.g. user@example.com)',
  })
  email?: string;
}
