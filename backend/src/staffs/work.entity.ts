import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Department } from '../departments/department.entity';

@Entity('works')
@Unique(['staff_id', 'department_id'])
export class Work {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'staff_id', type: 'int' })
  staff_id: number;

  @Index()
  @Column({ name: 'department_id', type: 'int' })
  department_id: number;

  @Column({ name: 'work_start_time', type: 'varchar', length: 16, default: '08:00' })
  work_start_time: string;

  @Column({ name: 'work_end_time', type: 'varchar', length: 16, default: '17:00' })
  work_end_time: string;

  @Column({ name: 'grace_period_minutes', type: 'int', default: 15 })
  grace_period_minutes: number;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  staff: User;

  @ManyToOne(() => Department, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'department_id' })
  department: Department;
}
