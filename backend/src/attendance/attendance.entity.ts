import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Branch } from '../branches/branch.entity';

export enum AttendanceAction {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT',
}

@Entity('attendances')
@Index(['branch_id', 'created_at'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'branch_id', type: 'int', default: 1 })
  branch_id: number;

  @ManyToOne(() => Branch, (branch) => branch.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Index()
  @Column({ name: 'staff_id', type: 'int' }) // this modify user_id from staff_id
  user_id: number;

  @Column({
    type: 'enum',
    enum: AttendanceAction,
  })
  action: AttendanceAction;

  @Column({ name: 'photo_url', type: 'varchar', length: 512 })
  photo_url: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => User, (user) => user.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  user: User;
}
