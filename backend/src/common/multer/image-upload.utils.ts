import { BadRequestException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

export function ensureDirExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export const imageFileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_IMAGE_MIMES.includes(file.mimetype) || !ALLOWED_IMAGE_EXTS.includes(ext)) {
    return cb(
      new BadRequestException(
        'Invalid image format. Only JPEG, PNG, and WebP files are allowed',
      ),
      false,
    );
  }
  cb(null, true);
};
