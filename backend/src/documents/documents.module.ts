import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { DocumentsController } from './documents.controller';
import { FilesService } from './services/files.service';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AuthModule } from '../auth/auth.module';
import { Workspace } from '../workspaces/entities/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([File, Workspace]),
    RetrievalModule,
    IngestionModule,
    WorkspacesModule,
    AuthModule,
  ],
  controllers: [DocumentsController],
  providers: [FilesService],
  exports: [TypeOrmModule, FilesService],
})
export class DocumentsModule {}
