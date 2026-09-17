import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import * as path from 'path';
import { AdminUser } from '../../users/admin-user.entity';
import {
  ALLOWED_IMAGE_EXTS,
  ALLOWED_IMAGE_MIMES,
  ensureDirExists,
  imageFileFilter,
} from './image-upload.utils';

export const AVATAR_MAX_SIZE = 200 * 1024; // Limit avatar upload size to 200KB
export const ALLOWED_AVATAR_MIMES = ALLOWED_IMAGE_MIMES;
export const ALLOWED_AVATAR_EXTS = ALLOWED_IMAGE_EXTS;

export const avatarMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const user = req.user as AdminUser;
      const subDir = user?.role === 1 ? 'super-admin' : 'admin';
      const uploadDir = path.join(process.cwd(), 'uploads', 'avatars', subDir);

      ensureDirExists(uploadDir);
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
  fileFilter: imageFileFilter,
};
