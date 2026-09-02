import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('admin_organizations')
export class AdminOrganization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'company_name', type: 'varchar', length: 255 })
  companyName: string;

  @Column({ name: 'admin_username', type: 'varchar', length: 255 })
  adminUsername: string;

  @Column({ name: 'contact_email', type: 'varchar', length: 255, nullable: true })
  contactEmail: string;

  @Column({ name: 'logo_url', type: 'varchar', length: 512, nullable: true })
  logoUrl: string;

  @Column({ type: 'varchar', length: 32, default: 'ACTIVE' })
  status: 'ACTIVE' | 'SUSPENDED';

  @Column({ name: 'work_start_time', type: 'varchar', length: 16, default: '08:00' })
  workStartTime: string;

  @Column({ name: 'work_end_time', type: 'varchar', length: 16, default: '17:00' })
  workEndTime: string;

  @Column({ name: 'grace_period_minutes', type: 'integer', default: 15 })
  gracePeriodMinutes: number;

  @Column({ name: 'telegram_bot_token', type: 'varchar', length: 255, nullable: true })
  telegramBotToken: string;

  @Column({ name: 'telegram_notification_chat_id', type: 'varchar', length: 255, nullable: true })
  telegramNotificationChatId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
