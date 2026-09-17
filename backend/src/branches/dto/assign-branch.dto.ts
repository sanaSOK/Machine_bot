import { IsNotEmpty, IsInt } from 'class-validator';

export class AssignBranchDto {
  @IsNotEmpty({ message: 'Branch ID is required' })
  @IsInt({ message: 'Branch ID must be an integer' })
  branch_id: number;
}

export class AssignAdminDto {
  @IsNotEmpty({ message: 'Admin ID is required' })
  @IsInt({ message: 'Admin ID must be an integer' })
  admin_id: number;
}

export class AssignPairDto {
  @IsNotEmpty({ message: 'Admin ID is required' })
  @IsInt({ message: 'Admin ID must be an integer' })
  admin_id: number;

  @IsNotEmpty({ message: 'Branch ID is required' })
  @IsInt({ message: 'Branch ID must be an integer' })
  branch_id: number;
}
