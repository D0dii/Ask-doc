import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { WorkspaceAccessGuard } from './guards/workspace-access.guard';
import { AuthModule } from '../auth/auth.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspace]),
    AuthModule,
    forwardRef(() => RagModule), // Use forwardRef to handle circular dependency
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService, WorkspaceAccessGuard],
  exports: [WorkspacesService, WorkspaceAccessGuard, TypeOrmModule],
})
export class WorkspacesModule {}
