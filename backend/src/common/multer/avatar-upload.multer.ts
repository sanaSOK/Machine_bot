import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { AdminUser } from '../../users/admin-user.entity';

export const AVATAR_MAX_SIZE = 200 * 1024; // just to updload image size only 200KB
export const ALLOWED_AVATAR_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_AVATAR_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];


export const avatarMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const user = req.user as AdminUser;
      const subDir = user?.role === 1 ? 'super-admin' : 'admin'; //  biz logic the same of role admin/super-admin
      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars', subDir);

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const user = req.user as AdminUser;
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      const safeExt = ALLOWED_AVATAR_EXTS.includes(ext) ? ext : '.png';
      const filename = `avatar_${user?.id || 'admin'}_${Date.now()}${safeExt}`;
      cb(null, filename);
    },
  }),
  limits: {
    fileSize: AVATAR_MAX_SIZE,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_AVATAR_MIMES.includes(file.mimetype) || !ALLOWED_AVATAR_EXTS.includes(ext)) {
      return cb(
        new BadRequestException(
          'Invalid image format. Only JPEG, PNG, and WebP files are allowed',
        ),
        false,
      );
    }
    cb(null, true);
  },
};
