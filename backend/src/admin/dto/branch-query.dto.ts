import { IsOptional, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';

export function ToOptionalNumber() {
  return Transform(({ value }) => {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      value === 'undefined' ||
      value === 'null' ||
      value === 'NaN' ||
      Number.isNaN(value)
    ) {
      return undefined;
    }
    const num = Number(value);
    return isNaN(num) ? value : num;
  });
}

export function ToOptionalString() {
  return Transform(({ value }) => {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      value === 'undefined' ||
      value === 'null'
    ) {
      return undefined;
    }
    return typeof value === 'string' ? value.trim() : value;
  });
}

export class BranchQueryDto {
  @IsOptional()
  @ToOptionalNumber()
  @IsInt()
  branch_id?: number;
}

