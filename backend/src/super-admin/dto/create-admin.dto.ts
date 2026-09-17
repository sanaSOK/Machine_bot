import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  IsOptional,
  IsInt,
} from 'class-validator';

export class CreateAdminDto {
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString({ message: 'Full name must be a string' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  fullname: string;

  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Invalid email address format' })
  @MaxLength(255, { message: 'Email cannot exceed 255 characters' })
  @Matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, {
    message: 'Email must be a valid email format (e.g. user@example.com)',
  })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).{8,128}$/,
    {
      message:
        'Password must contain at least 8 characters, including at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
    },
  )
  password: string;

  @IsNotEmpty({ message: 'Branch ID is required' })
  @IsInt({ message: 'Branch ID must be an integer' })
  branch_id: number;

  @IsOptional()
  telegram_chat_id?: string | number;

  @IsOptional()
  chat_id?: string | number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  profile_url?: string;
}
