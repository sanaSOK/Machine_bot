import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Attendance } from '../attendance/attendance.entity';
import { Branch } from '../branches/branch.entity';

@Entity('staffs')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'department_id', type: 'int', default: 1 })
  department_id: number;

  @Index()
  @Column({ name: 'branch_id', type: 'int', nullable: true })
  branch_id: number | null;

  @ManyToOne(() => Branch, (branch) => branch.staffs, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  @Column({ name: 'fullname', type: 'varchar', length: 100 })
  first_name: string;

  @Column({ name: 'telegram_chat_id', type: 'bigint', nullable: true, unique: true })
  telegram_user_id: string;

  @Column({ type: 'tinyint', default: 1 })
  role: string | number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'profile_url', type: 'varchar', length: 255, nullable: true })
  photo_url: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @Column({ name: 'username', type: 'varchar', length: 100, nullable: true })
  username: string | null;

  // Unmapped helper fields for existing services
  last_name?: string | null;
  address?: string | null;

  @OneToMany(() => Attendance, (attendance) => attendance.user)
  attendances: Attendance[];
}
