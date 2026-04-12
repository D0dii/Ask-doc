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
import { User } from '../../users/entities/user.entity';
import { File } from '../../documents/entities/file.entity';
import { ChatThread } from '../../chat/entities/chat-thread.entity';
import { Note } from '../../notes/entities/note.entity';
import { Flashcard } from '../../flashcards/entities/flashcard.entity';

@Entity()
export class KnowledgeHub {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => User, (user) => user.knowledgeHubs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => File, (file) => file.knowledgeHub)
  files: File[];

  @OneToMany(() => ChatThread, (thread) => thread.knowledgeHub)
  chatThreads: ChatThread[];

  @OneToMany(() => Note, (note) => note.knowledgeHub)
  notes: Note[];

  @OneToMany(() => Flashcard, (flashcard) => flashcard.knowledgeHub)
  flashcards: Flashcard[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
