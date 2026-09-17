import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Branch } from './branch.entity';
import { AdminUser } from '../users/admin-user.entity';
import { User } from '../users/user.entity';
import { Department } from '../admin/department.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { AdminResponseDto, BranchSummaryDto } from '../super-admin/dto/admin-response.dto';
import { AdminRole } from '../common/decorators/roles.decorator';

@Injectable()
export class BranchesService {
  private readonly logger = new Logger(BranchesService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(AdminUser)
    private readonly adminUserRepository: Repository<AdminUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) {}


  async getBranches(): Promise<any[]> {
    const branches = await this.branchRepository.find({
      relations: ['admin', 'creator'],
      order: { created_at: 'DESC' },
    });

    const result = [];
    for (const b of branches) {
      const staffCount = await this.userRepository.count({
        where: { branch_id: b.id, is_active: true },
      });
      const departmentCount = await this.departmentRepository.count({
        where: { branch_id: b.id },
      });

      result.push({
        id: b.id,
        name: b.name,
        address: b.address,
        phone: b.phone,
        is_active: b.is_active,
        admin_id: b.admin_id,
        created_at: b.created_at,
        admin: b.admin
          ? {
              id: b.admin.id,
              fullname: b.admin.fullname,
              email: b.admin.email,
              is_active: b.admin.is_active,
            }
          : null,
        staffCount,
        departmentCount,
      });
    }

    return result;
  }

  async createBranch(dto: CreateBranchDto, creatorId: number = 1): Promise<Branch> {
    const cleanName = dto.name.trim();

    const existing = await this.branchRepository.findOne({
      where: { name: cleanName },
    });
    if (existing) {
      throw new ConflictException(`Branch with name "${cleanName}" already exists`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const branch = queryRunner.manager.create(Branch, {
        name: cleanName,
        address: dto.address ? dto.address.trim() : null,
        phone: dto.phone ? dto.phone.trim() : null,
        is_active: 1,
        created_by: creatorId,
      });
      const savedBranch = await queryRunner.manager.save(branch);

      // during create branch wll generate Department auto by name: General
      const defaultDept = queryRunner.manager.create(Department, {
        name: 'General',
        description: `Default department for ${savedBranch.name}`,
        color: '#6366f1',
        branch_id: savedBranch.id,
      });
      await queryRunner.manager.save(defaultDept);

      await queryRunner.commitTransaction();
      return savedBranch;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async assignBranch(adminId: number, branchId: number): Promise<AdminResponseDto> {
    const admin = await this.adminUserRepository.findOne({
      where: { id: adminId },
      relations: ['branch'],
    });

    if (!admin) {
      throw new NotFoundException(`Admin account with ID ${adminId} not found`);
    }

    if (admin.role === AdminRole.SUPER_ADMIN) {
      throw new ConflictException('Super Admin cannot be assigned to a specific branch');
    }

    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    const existingAdmin = await this.adminUserRepository.findOne({
      where: { branch_id: branchId },
    });

    if (existingAdmin && existingAdmin.id !== adminId) {
      throw new ConflictException(
        `Branch "${branch.name}" is already assigned to Admin "${existingAdmin.email}"`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // If admin previously had another branch, clear that branch's admin_id
      if (admin.branch_id && admin.branch_id !== branchId) {
        await queryRunner.manager.update(Branch, admin.branch_id, { admin_id: null });
      }

      // Update new branch's admin_id
      branch.admin_id = adminId;
      await queryRunner.manager.save(branch);

      // Update admin's branch_id
      admin.branch_id = branchId;
      const savedAdmin = await queryRunner.manager.save(admin);

      await queryRunner.commitTransaction();
      return this.toResponseDto(savedAdmin, branch);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }


  async updateBranch(id: number, dto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    if (dto.name !== undefined) branch.name = dto.name.trim();
    if (dto.address !== undefined) branch.address = dto.address ? dto.address.trim() : null;
    if (dto.phone !== undefined) branch.phone = dto.phone ? dto.phone.trim() : null;
    if (dto.is_active !== undefined) branch.is_active = dto.is_active;

    return this.branchRepository.save(branch);
  }


  async deleteBranch(id: number): Promise<{ success: boolean; message: string }> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['admin'],
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    if (id === 1) {
      throw new ConflictException('Cannot delete default Head Office branch');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (branch.admin_id) {
        await queryRunner.manager.update(AdminUser, branch.admin_id, { branch_id: null });
      }

      await queryRunner.manager.delete(Branch, id);
      await queryRunner.commitTransaction();

      return { success: true, message: `Branch "${branch.name}" deleted successfully` };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private toResponseDto(entity: AdminUser, branch?: Branch | null): AdminResponseDto {
    let branchDto: BranchSummaryDto | null = null;
    if (branch) {
      branchDto = {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        admin_id: branch.admin_id,
        is_active: branch.is_active,
      };
    }

    return {
      id: entity.id,
      fullname: entity.fullname,
      email: entity.email,
      profile_url: entity.profile_url,
      role: entity.role,
      branch_id: entity.branch_id,
      branch: branchDto,
      is_active: entity.is_active,
      is_verified: entity.is_verified,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
