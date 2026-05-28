import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from './entities/file.entity';
import { DocumentsController } from './documents.controller';
import { FilesService } from './services/files.service';
import { IngestionModule } from '../ingestion/ingestion.module';
import { AuthModule } from '../auth/auth.module';
import { SharedModule } from '../shared/shared.module';
import { KnowledgeHub } from '../knowledge-hubs/entities/knowledge-hub.entity';
import { KnowledgeHubsModule } from '../knowledge-hubs/knowledge-hubs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([File, KnowledgeHub]),
    IngestionModule,
    KnowledgeHubsModule,
    AuthModule,
    SharedModule,
  ],
  controllers: [DocumentsController],
  providers: [FilesService],
  exports: [TypeOrmModule, FilesService],
})
export class DocumentsModule {}
