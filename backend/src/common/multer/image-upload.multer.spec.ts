import { BadRequestException } from '@nestjs/common';
import {
  ALLOWED_IMAGE_EXTS,
  ALLOWED_IMAGE_MIMES,
  ensureDirExists,
  imageFileFilter,
} from './image-upload.utils';
import { logoMulterOptions, LOGO_MAX_SIZE } from './logo-upload.multer';
import { avatarMulterOptions, AVATAR_MAX_SIZE } from './avatar-upload.multer';
import * as fs from 'fs';
import * as path from 'path';

describe('Image Upload Multer Configuration', () => {
  describe('imageFileFilter', () => {
    it('should accept valid image files (png, jpg, webp)', (done) => {
      const mockFile = {
        originalname: 'test_image.PNG',
        mimetype: 'image/png',
      } as Express.Multer.File;

      imageFileFilter({} as any, mockFile, (err, accept) => {
        expect(err).toBeNull();
        expect(accept).toBe(true);
        done();
      });
    });

    it('should reject disallowed mimetypes', (done) => {
      const mockFile = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
      } as Express.Multer.File;

      imageFileFilter({} as any, mockFile, (err, accept) => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(err?.message).toContain('Invalid image format');
        expect(accept).toBe(false);
        done();
      });
    });

    it('should reject invalid extensions even if mimetype looks like an image', (done) => {
      const mockFile = {
        originalname: 'exploit.sh',
        mimetype: 'image/png',
      } as Express.Multer.File;

      imageFileFilter({} as any, mockFile, (err, accept) => {
        expect(err).toBeInstanceOf(BadRequestException);
        expect(accept).toBe(false);
        done();
      });
    });
  });

  describe('ensureDirExists', () => {
    const testDir = path.join(process.cwd(), 'uploads', 'test_mkdir_temp');

    afterAll(() => {
      if (fs.existsSync(testDir)) {
        fs.rmdirSync(testDir);
      }
    });

    it('should create directory if it does not exist', () => {
      if (fs.existsSync(testDir)) {
        fs.rmdirSync(testDir);
      }
      expect(fs.existsSync(testDir)).toBe(false);
      ensureDirExists(testDir);
      expect(fs.existsSync(testDir)).toBe(true);
    });
  });

  describe('Multer Options limits', () => {
    it('should configure logo upload with 2MB limit', () => {
      expect(logoMulterOptions.limits?.fileSize).toBe(LOGO_MAX_SIZE);
      expect(LOGO_MAX_SIZE).toBe(2 * 1024 * 1024);
    });

    it('should configure avatar upload with 200KB limit', () => {
      expect(avatarMulterOptions.limits?.fileSize).toBe(AVATAR_MAX_SIZE);
      expect(AVATAR_MAX_SIZE).toBe(200 * 1024);
    });
  });
});
