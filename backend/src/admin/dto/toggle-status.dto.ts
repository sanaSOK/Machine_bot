import { IsNotEmpty, IsBoolean } from 'class-validator';

export class ToggleStatusDto {
  @IsNotEmpty()
  @IsBoolean()
  is_active: boolean;
}
