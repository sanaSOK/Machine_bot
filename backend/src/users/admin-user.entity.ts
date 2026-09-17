import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Branch } from '../branches/branch.entity';

@Entity('users')
export class AdminUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  fullname: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password?: string;

  @Column({ name: 'profile_url', type: 'varchar', length: 255, nullable: true })
  profile_url: string | null;

  @Column({ type: 'tinyint', default: 1 })
  role: number; // 1 = Super-Admin, 2 = Admin

  @Column({ name: 'branch_id', type: 'int', nullable: true, unique: true })
  branch_id: number | null;

  @Column({ name: 'telegram_chat_id', type: 'bigint', nullable: true, unique: true })
  telegram_chat_id: string | null;

  @OneToOne(() => Branch, (branch) => branch.admin, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch | null;

  @Column({ name: 'is_active', type: 'tinyint', default: 1 })
  is_active: number;

  @Column({ name: 'is_verified', type: 'tinyint', default: 0 })
  is_verified: number;

  @Index()
  @Column({ name: 'verification_token_hash', type: 'varchar', length: 255, nullable: true })
  verification_token_hash: string | null;

  @Column({ name: 'verification_expires', type: 'datetime', nullable: true })
  verification_expires: Date | null;

  @Column({ name: 'last_login', type: 'datetime', nullable: true })
  last_login: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
