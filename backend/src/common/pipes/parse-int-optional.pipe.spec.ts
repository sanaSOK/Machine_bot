import { BadRequestException } from '@nestjs/common';
import { ParseIntOptionalPipe } from './parse-int-optional.pipe';

describe('ParseIntOptionalPipe', () => {
  let pipe: ParseIntOptionalPipe;

  beforeEach(() => {
    pipe = new ParseIntOptionalPipe();
  });

  it('should return undefined for undefined, null, or empty string', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
    expect(pipe.transform(null)).toBeUndefined();
    expect(pipe.transform('')).toBeUndefined();
  });

  it('should return undefined for "NaN", "undefined", and "null" strings', () => {
    expect(pipe.transform('NaN')).toBeUndefined();
    expect(pipe.transform('undefined')).toBeUndefined();
    expect(pipe.transform('null')).toBeUndefined();
    expect(pipe.transform(NaN)).toBeUndefined();
  });

  it('should parse valid numbers and numeric strings', () => {
    expect(pipe.transform('10')).toBe(10);
    expect(pipe.transform('1')).toBe(1);
    expect(pipe.transform(5)).toBe(5);
    expect(pipe.transform('0')).toBe(0);
  });

  it('should throw BadRequestException for invalid non-numeric strings', () => {
    expect(() => pipe.transform('abc')).toThrow(BadRequestException);
    expect(() => pipe.transform('invalid')).toThrow(BadRequestException);
  });
});
