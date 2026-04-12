import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { KnowledgeHub } from '../../knowledge-hubs/entities/knowledge-hub.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => KnowledgeHub, (knowledgeHub) => knowledgeHub.owner)
  knowledgeHubs: KnowledgeHub[];

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ nullable: true, select: false })
  accessToken: string;

  @Column({ nullable: true, select: false })
  refreshToken: string;

  @Column({ default: false })
  isAdmin: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
