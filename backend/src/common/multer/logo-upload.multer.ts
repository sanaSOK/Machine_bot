import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import * as path from 'path';
import {
  ALLOWED_IMAGE_EXTS,
  ensureDirExists,
  imageFileFilter,
} from './image-upload.utils';

export const LOGO_MAX_SIZE = 2 * 1024 * 1024; // 2MB max for company logo

export const logoMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads');
      ensureDirExists(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.png';
      const safeExt = ALLOWED_IMAGE_EXTS.includes(ext) ? ext : '.png';
      cb(null, `company_logo${safeExt}`);
    },
  }),
  limits: {
    fileSize: LOGO_MAX_SIZE,
  },
  fileFilter: imageFileFilter,
};
