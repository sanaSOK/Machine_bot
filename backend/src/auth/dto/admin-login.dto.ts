import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AdminLoginDto {
  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Invalid email address format' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  password: string;
}
