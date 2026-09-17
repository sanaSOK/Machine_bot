import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntOptionalPipe implements PipeTransform<any, number | undefined> {
  private static readonly EMPTY_VALUES = new Set([
    undefined,
    null,
    '',
    'undefined',
    'null',
    'NaN',
  ]);

  transform(value: any): number | undefined {
    // Specifically catches all empty/unset values (including "NaN")
    if (ParseIntOptionalPipe.EMPTY_VALUES.has(value) || Number.isNaN(value)) {
      return undefined;
    }

    // Parse numeric string to integer
    const parsed = typeof value === 'number' ? value : parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new BadRequestException(`Expected a numeric value, received: "${value}"`);
    }

    return parsed;
  }
}
