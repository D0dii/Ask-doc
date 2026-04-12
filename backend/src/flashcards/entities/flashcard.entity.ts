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

export enum FlashcardGenerationMode {
  FROM_ANSWER = 'from_answer',
  FROM_SELECTION = 'from_selection',
  FROM_TOPIC_QUERY = 'from_topic_query',
}

@Entity()
export class Flashcard {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  front: string;

  @Column({ type: 'text' })
  back: string;

  @Column()
  knowledgeHubId: string;

  @Column()
  ownerId: string;

  @Column({
    type: 'enum',
    enum: FlashcardGenerationMode,
    nullable: true,
  })
  generationMode: FlashcardGenerationMode | null;

  @Column({ type: 'jsonb', nullable: true })
  sourceMetadata: {
    sources: Array<{ sourceType: string; sourceRef?: string; score?: number }>;
    includeWebSources: boolean;
  } | null;

  @ManyToOne(() => KnowledgeHub, (knowledgeHub) => knowledgeHub.flashcards, {
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
