import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { File } from './entities/file.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    WorkspacesModule, // Provides WorkspaceAccessGuard and Workspace entity
    AuthModule, // Provides JwtCookieGuard
  ],
  controllers: [RagController],
  providers: [RagService],
})
export class RagModule {}
