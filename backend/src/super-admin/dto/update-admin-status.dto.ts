import { IsIn, IsNotEmpty, IsNumber } from 'class-validator';
import { AccountStatus } from '../../common/enums/account-status.enum';

export class UpdateAdminStatusDto {
  @IsNotEmpty({ message: 'is_active is required' })
  @IsNumber({}, { message: 'is_active must be a number' })
  @IsIn([AccountStatus.ACTIVE, AccountStatus.INACTIVE], {
    message: 'is_active must be 1 (active) or 2 (inactive)',
  })
  is_active: number;
}
