import { PasswordUtil } from './password.util';

describe('PasswordUtil', () => {
  it('should hash a password and verify it correctly', () => {
    const raw = 'mySuperSecretPassword123';
    const hash = PasswordUtil.hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash).toContain(':');

    const isValid = PasswordUtil.verifyPassword(raw, hash);
    expect(isValid).toBe(true);

    const isInvalid = PasswordUtil.verifyPassword('wrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('should return false for malformed hash', () => {
    expect(PasswordUtil.verifyPassword('pass', '')).toBe(false);
    expect(PasswordUtil.verifyPassword('pass', 'malformedhashwithoutcolon')).toBe(false);
  });
});
