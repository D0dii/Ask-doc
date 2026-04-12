import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from './entities/note.entity';
import { NotesService } from './notes.service';
import { NotesController } from './notes.controller';
import { SharedModule } from '../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { KnowledgeHubsModule } from '../knowledge-hubs/knowledge-hubs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Note]),
    SharedModule,
    KnowledgeHubsModule,
    AuthModule,
  ],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
