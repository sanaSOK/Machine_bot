import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendVerificationDto {
  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Invalid email address format' })
  email: string;
}
