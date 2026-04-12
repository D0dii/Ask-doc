import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeHubsController } from './knowledge-hubs.controller';
import { KnowledgeHubsService } from './knowledge-hubs.service';
import { KnowledgeHub } from './entities/knowledge-hub.entity';
import { KnowledgeHubAccessGuard } from './guards/knowledge-hub-access.guard';
import { SharedModule } from '../shared/shared.module';
import { AuthModule } from '../auth/auth.module';
import { File } from '../documents/entities/file.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([KnowledgeHub, File]),
    SharedModule,
    AuthModule,
  ],
  controllers: [KnowledgeHubsController],
  providers: [KnowledgeHubsService, KnowledgeHubAccessGuard],
  exports: [KnowledgeHubsService, KnowledgeHubAccessGuard, TypeOrmModule],
})
export class KnowledgeHubsModule {}
