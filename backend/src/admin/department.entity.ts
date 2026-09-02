import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 128, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 32, default: '#6366f1' })
  color: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
