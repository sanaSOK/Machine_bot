/**
 * 
 * TESTING get profile , update profile and del profile
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AdminUser } from '../users/admin-user.entity';

describe('ProfileService', () => {
  let service: ProfileService;
  let adminUserRepositoryMock: any;

  const mockAdmin: AdminUser = {
    id: 1,
    fullname: 'Super Admin',
    email: 'superadmin@eroxii.com',
    password: 'hash',
    profile_url: '/uploads/avatars/super-admin/old_avatar.png',
    role: 1,
    branch_id: null,
    branch: null,
    telegram_chat_id: null,
    is_active: 1,
    is_verified: 1,
    verification_token_hash: null,
    verification_expires: null,
    last_login: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    adminUserRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...entity, updated_at: new Date() })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getRepositoryToken(AdminUser),
          useValue: adminUserRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return sanitized profile for existing administrator', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({ ...mockAdmin });

      const profile = await service.getProfile(1);
      expect(profile).toBeDefined();
      expect(profile.id).toBe(1);
      expect(profile.email).toBe('superadmin@eroxii.com');
      expect(profile.role_name).toBe('Super-Admin');
      expect((profile as any).password).toBeUndefined();
    });

    it('should throw NotFoundException if admin not found', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    it('should successfully update fullname and email', async () => {
      adminUserRepositoryMock.findOne
        .mockResolvedValueOnce({ ...mockAdmin }) // find for user
        .mockResolvedValueOnce(null); // check email uniqueness

      const result = await service.updateProfile(1, {
        fullname: 'Updated Super Admin',
        email: 'newemail@eroxii.com',
      });

      expect(result.fullname).toBe('Updated Super Admin');
      expect(result.email).toBe('newemail@eroxii.com');
    });

    it('should throw ConflictException if new email is already taken by another admin', async () => {
      adminUserRepositoryMock.findOne
        .mockResolvedValueOnce({ ...mockAdmin }) // find for user
        .mockResolvedValueOnce({ id: 2, email: 'taken@eroxii.com' }); // email conflict

      await expect(
        service.updateProfile(1, {
          email: 'taken@eroxii.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateAvatar', () => {
    it('should update profile_url with proper subfolder', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({ ...mockAdmin });

      const result = await service.updateAvatar(1, 'new_avatar.png', 'super-admin');
      expect(result.profile_url).toBe('/uploads/avatars/super-admin/new_avatar.png');
    });
  });

  describe('deleteAvatar', () => {
    it('should reset profile_url to null and return success message', async () => {
      adminUserRepositoryMock.findOne.mockResolvedValue({ ...mockAdmin, profile_url: '/uploads/avatars/admin/avatar.png' });

      const result = await service.deleteAvatar(1);
      expect(result.message).toBe('Avatar deleted successfully');
      expect(adminUserRepositoryMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ profile_url: null }),
      );
    });
  });
});
