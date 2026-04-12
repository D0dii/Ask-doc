import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { KnowledgeHub } from '../../knowledge-hubs/entities/knowledge-hub.entity';

export enum FileStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity()
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  originalName: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ nullable: true })
  size: number;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.PENDING,
  })
  status: FileStatus;

  @Column({ nullable: true })
  errorMessage: string;

  @Column()
  knowledgeHubId: string;

  @ManyToOne(() => KnowledgeHub, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'knowledgeHubId', referencedColumnName: 'id' })
  knowledgeHub: KnowledgeHub;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
