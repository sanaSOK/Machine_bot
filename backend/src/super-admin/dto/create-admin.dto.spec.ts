import { validate } from 'class-validator';
import { CreateAdminDto } from './create-admin.dto';

describe('CreateAdminDto Validation', () => {
  function createDto(partial: Partial<CreateAdminDto>): CreateAdminDto {
    const dto = new CreateAdminDto();
    dto.fullname = partial.fullname ?? 'Valid Admin';
    dto.email = partial.email ?? 'admin@example.com';
    dto.password = partial.password ?? 'Password123!';
    if (partial.profile_url !== undefined) {
      dto.profile_url = partial.profile_url;
    }
    return dto;
  }

  it('should pass with valid email and strong password', async () => {
    const dto = createDto({});
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  describe('Password Validation', () => {
    it('should fail if password has no uppercase letter', async () => {
      const dto = createDto({ password: 'password123!' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should fail if password has no lowercase letter', async () => {
      const dto = createDto({ password: 'PASSWORD123!' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should fail if password has no digit', async () => {
      const dto = createDto({ password: 'Password!@#' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should fail if password has no special character', async () => {
      const dto = createDto({ password: 'Password123' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });

    it('should fail if password is shorter than 8 characters', async () => {
      const dto = createDto({ password: 'P1!pass' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'password')).toBe(true);
    });
  });

  describe('Email Validation', () => {
    it('should fail for invalid email', async () => {
      const dto = createDto({ email: 'invalid-email-string' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });

    it('should fail for email without domain extension', async () => {
      const dto = createDto({ email: 'user@localhost' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'email')).toBe(true);
    });
  });
});
