import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { KnowledgeHub } from '../../knowledge-hubs/entities/knowledge-hub.entity';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

@Entity()
export class ChatThread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  title: string | null;

  @Column({ unique: true })
  knowledgeHubId: string;

  @ManyToOne(() => KnowledgeHub, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'knowledgeHubId' })
  knowledgeHub: KnowledgeHub;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => ChatMessage, (message) => message.thread)
  messages: ChatMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
