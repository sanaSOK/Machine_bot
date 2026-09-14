import * as crypto from 'crypto';

// hash
export class PasswordUtil {
  private static readonly ITERATIONS = 100000;
  private static readonly KEYLEN = 64;
  private static readonly DIGEST = 'sha512';

  static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(password, salt, this.ITERATIONS, this.KEYLEN, this.DIGEST)
      .toString('hex');
    return `${salt}:${hash}`;
  }

  // verify password
  static verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash || !storedHash.includes(':')) {
      return false;
    }
    const [salt, originalHash] = storedHash.split(':');
    const computedHash = crypto
      .pbkdf2Sync(password, salt, this.ITERATIONS, this.KEYLEN, this.DIGEST)
      .toString('hex');

    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'hex'),
      Buffer.from(originalHash, 'hex'),
    );
  }
}
