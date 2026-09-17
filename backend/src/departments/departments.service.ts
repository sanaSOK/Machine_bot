import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './department.entity';
import { User } from '../users/user.entity';
import { resolveBranchScope } from '../common/utils/branch-scope.util';
import { DEPT_COLORS } from '../common/constants/app.constants';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

export interface DepartmentItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  userCount?: number;
}

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}


  async ensureDepartmentExists(name: string, branchId: number = 1): Promise<Department> {
    const cleanName = name.trim().toUpperCase();
    const existing = await this.departmentRepository.findOne({ where: { name: cleanName, branch_id: branchId } });
    if (existing) return existing;

    const newDept = this.departmentRepository.create({
      name: cleanName,
      description: `${cleanName} Department`,
      color: '#6366f1',
      branch_id: branchId,
    });
    return this.departmentRepository.save(newDept);
  }

  async getDepartments(user?: any, requestedBranchId?: number): Promise<DepartmentItem[]> {
    const branchId = user ? resolveBranchScope(user, requestedBranchId) : null;

    const where: any = branchId ? { branch_id: branchId } : {};
    const depts = await this.departmentRepository.find({ where, order: { id: 'ASC' } });

    const staffWhere: any = branchId ? { branch_id: branchId } : {};
    const users = await this.userRepository.find({ where: staffWhere });

    return depts.map((d) => {
      const userCount = users.filter(
        (u) => String(u.role || '').trim().toUpperCase() === d.name.toUpperCase(),
      ).length;

      return {
        id: String(d.id),
        name: d.name,
        description: d.description || `${d.name} Department`,
        color: d.color || '#6366f1',
        createdAt: d.createdAt ? d.createdAt.toISOString() : new Date().toISOString(),
        userCount,
      };
    });
  }



  async createDepartment(user: any, dto: CreateDepartmentDto): Promise<DepartmentItem[]> {
    const branchId = resolveBranchScope(user, dto.branch_id) || 1;
    const cleanName = dto.name.trim().toUpperCase();

    const existing = await this.departmentRepository.findOne({
      where: { name: cleanName, branch_id: branchId },
    });
    if (existing) {
      throw new ConflictException(`Department "${cleanName}" already exists in this branch`);
    }

    const randomColor = DEPT_COLORS[Math.floor(Math.random() * DEPT_COLORS.length)];

    const newDept = this.departmentRepository.create({
      name: cleanName,
      description: dto.description ? dto.description.trim() : '',
      color: dto.color || randomColor,
      branch_id: branchId,
    });
    await this.departmentRepository.save(newDept);

    return this.getDepartments(user, branchId);
  }

  async updateDepartment(
    user: any,
    idOrName: string,
    dto: UpdateDepartmentDto,
  ): Promise<DepartmentItem[]> {
    const branchId = resolveBranchScope(user);
    const dept = await this.resolveDeptByIdOrName(idOrName, branchId);

    if (!dept) {
      throw new NotFoundException(`Department "${idOrName}" not found`);
    }

    if (branchId && dept.branch_id && dept.branch_id !== branchId) {
      throw new ForbiddenException('Cannot modify department from another branch');
    }

    if (dto.name) {
      const cleanName = dto.name.trim().toUpperCase();
      if (cleanName !== dept.name) {
        const oldName = dept.name;
        dept.name = cleanName;
        // Cascade rename to all staff with matching role
        const usersWhere: any = { role: oldName };
        if (branchId) usersWhere.branch_id = branchId;
        const usersToUpdate = await this.userRepository.find({ where: usersWhere });
        for (const u of usersToUpdate) {
          u.role = cleanName;
          await this.userRepository.save(u);
        }
      }
    }

    if (dto.description !== undefined) dept.description = dto.description.trim();
    if (dto.color) dept.color = dto.color;

    await this.departmentRepository.save(dept);
    return this.getDepartments(user);
  }

  async deleteDepartment(user: any, idOrName: string): Promise<DepartmentItem[]> {
    const branchId = resolveBranchScope(user);
    const numericId = parseInt(idOrName, 10);

    if (!isNaN(numericId)) {
      const dept = await this.departmentRepository.findOne({ where: { id: numericId } });
      if (dept) {
        if (branchId && dept.branch_id && dept.branch_id !== branchId) {
          throw new ForbiddenException('Cannot delete department from another branch');
        }
        await this.departmentRepository.delete({ id: numericId });
      }
    } else {
      const clean = idOrName.trim().toUpperCase();
      const where: any = { name: clean };
      if (branchId) where.branch_id = branchId;
      const dept = await this.departmentRepository.findOne({ where });
      if (dept) {
        await this.departmentRepository.delete({ id: dept.id });
      }
    }

    return this.getDepartments(user);
  }


  private async resolveDeptByIdOrName(
    idOrName: string,
    branchId: number | null,
  ): Promise<Department | null> {
    const numericId = parseInt(idOrName, 10);
    if (!isNaN(numericId)) {
      return this.departmentRepository.findOne({ where: { id: numericId } });
    }
    const where: any = { name: idOrName };
    if (branchId) where.branch_id = branchId;
    return this.departmentRepository.findOne({ where });
  }
}
