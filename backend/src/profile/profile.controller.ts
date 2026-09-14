import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AdminUser } from '../users/admin-user.entity';
import { avatarMulterOptions } from '../common/multer/avatar-upload.multer';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('/me')
  @ResponseMessage('Profile retrieved successed')
  async getProfile(@CurrentUser() user: AdminUser) {
    return this.profileService.getProfile(user.id);
  }

  /**
   * This @put define update based on field: fullname, email
   * @email by default this not needs verify with mail-services
   * JUST TO: static email during create acc 
   */
  @Put('update-info')
  @ResponseMessage('Profile updated successed')
  async updateProfile(
    @CurrentUser() user: AdminUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, dto);
  }

  @Post('avatar/upload')
  @ResponseMessage('Avatar uploaded successed')
  @UseInterceptors(FileInterceptor('avatar', avatarMulterOptions))
  async uploadAvatar(
    @CurrentUser() user: AdminUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Avatar file is required and must be an image (JPEG, PNG, WebP) under 200KB',
      );
    }

    const subDir = user.role === 1 ? 'super-admin' : 'admin';
    return this.profileService.updateAvatar(user.id, file.filename, subDir);
  }

  @Delete('avatar/delete')
  @ResponseMessage('Avatar deleted successed')
  async deleteAvatar(@CurrentUser() user: AdminUser) {
    return this.profileService.deleteAvatar(user.id);
  }
}
