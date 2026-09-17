import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AdminUser } from '../users/admin-user.entity';
import { Department } from '../admin/department.entity';
import { User } from '../users/user.entity';
import { Attendance } from '../attendance/attendance.entity';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  is_active: number;

  @Column({ name: 'created_by', type: 'int' })
  created_by: number;

  @ManyToOne(() => AdminUser, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: AdminUser;

  @Column({ name: 'admin_id', type: 'int', nullable: true, unique: true })
  admin_id: number | null;

  @OneToOne(() => AdminUser, (admin) => admin.branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_id' })
  admin: AdminUser | null;

  @OneToMany(() => Department, (dept) => dept.branch)
  departments: Department[];

  @OneToMany(() => User, (staff) => staff.branch)
  staffs: User[];

  @OneToMany(() => Attendance, (attendance) => attendance.branch)
  attendances: Attendance[];

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
