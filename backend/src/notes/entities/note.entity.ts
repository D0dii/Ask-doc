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
import { User } from '../../users/entities/user.entity';

export enum NoteGenerationMode {
  FROM_ANSWER = 'from_answer',
  FROM_SELECTION = 'from_selection',
  FROM_TOPIC_QUERY = 'from_topic_query',
}

@Entity()
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column()
  knowledgeHubId: string;

  @Column()
  ownerId: string;

  @Column({
    type: 'enum',
    enum: NoteGenerationMode,
    nullable: true,
  })
  generationMode: NoteGenerationMode | null;

  @Column({ type: 'jsonb', nullable: true })
  sourceMetadata: {
    sources: Array<{ sourceType: string; sourceRef?: string; score?: number }>;
    includeWebSources: boolean;
  } | null;

  @ManyToOne(() => KnowledgeHub, (knowledgeHub) => knowledgeHub.notes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'knowledgeHubId', referencedColumnName: 'id' })
  knowledgeHub: KnowledgeHub;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId', referencedColumnName: 'id' })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
