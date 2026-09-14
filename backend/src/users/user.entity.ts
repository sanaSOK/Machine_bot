import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Attendance } from '../attendance/attendance.entity';

@Entity('staffs')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'department_id', type: 'int', default: 1 })
  department_id: number;

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

  // Unmapped helper fields for existing services
  last_name?: string | null;
  username?: string | null;
  address?: string | null;

  @OneToMany(() => Attendance, (attendance) => attendance.user)
  attendances: Attendance[];
}
