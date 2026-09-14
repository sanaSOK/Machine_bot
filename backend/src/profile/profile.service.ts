import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { AdminUser } from '../users/admin-user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface ProfileResponse {
  id: number;
  fullname: string;
  email: string;
  profile_url: string | null;
  role: number;
  role_name: string;
  is_active: number;
  is_verified: number;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
  ) {}


  async getProfile(userId: number): Promise<ProfileResponse> {
    const admin = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${userId} not found`);
    }

    return this.toResponse(admin);
  }

  // update fullname, email
  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<ProfileResponse> {
    const admin = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${userId} not found`);
    }

    if (dto.email) {
      const cleanEmail = dto.email.trim().toLowerCase();
      if (cleanEmail !== admin.email.toLowerCase()) {
        const existing = await this.adminUserRepository.findOne({
          where: {
            email: cleanEmail,
            id: Not(userId),
          },
        });

        if (existing) {
          throw new ConflictException(`Email "${cleanEmail}" is already in use by another account`);
        }

        admin.email = cleanEmail;
      }
    }

    if (dto.fullname) {
      admin.fullname = dto.fullname.trim();
    }

    const saved = await this.adminUserRepository.save(admin);
    return this.toResponse(saved);
  }

  /**
   * Update administrator avatar image path
   * this image i'll store this in path folder uploads
   * + uploads/avatar/admin --- for admin
   * + uploads/avatar/super-admin for super-admin
   */
  async updateAvatar(userId: number, filename: string, subDir: string): Promise<ProfileResponse> {
    const admin = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${userId} not found`);
    }

    // delete old avatar from disk if exists
    this.deleteAvatarFileFromDisk(admin.profile_url);

    // save new avatar
    admin.profile_url = `/uploads/avatars/${subDir}/${filename}`; 
    const saved = await this.adminUserRepository.save(admin);
    return this.toResponse(saved);
  }


  async deleteAvatar(userId: number): Promise<{ message: string }> {
    const admin = await this.adminUserRepository.findOne({
      where: { id: userId },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${userId} not found`);
    }

    if (admin.profile_url) {
      this.deleteAvatarFileFromDisk(admin.profile_url);
      admin.profile_url = null;
      await this.adminUserRepository.save(admin);
      this.logger.log(`Avatar deleted for ${admin.email}`);
    }

    return { message: 'Avatar deleted successed' };
  }


  // remove avatar from storage disk
  private deleteAvatarFileFromDisk(profileUrl: string | null): void {
    if (!profileUrl) return;

    try {
      const cleanPath = profileUrl.split('?')[0];
      const relativePath = cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
      const fullPath = path.join(process.cwd(), relativePath);

      if (fs.existsSync(fullPath))  fs.unlinkSync(fullPath);
    } catch (err: any) {
      this.logger.warn(`Failed to delete avatar file from disk: ${err.message}`);
    }
  }

  private toResponse(entity: AdminUser): ProfileResponse {
    return {
      id: entity.id,
      fullname: entity.fullname,
      email: entity.email,
      profile_url: entity.profile_url,
      role: entity.role,
      role_name: entity.role === 1 ? 'Super-Admin' : 'Admin',
      is_active: entity.is_active,
      is_verified: entity.is_verified,
      last_login: entity.last_login,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
