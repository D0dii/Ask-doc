import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagController } from './rag.controller';
import { FilesService, VectorStoreService } from './services';
import { File } from './entities/file.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    forwardRef(() => WorkspacesModule), // Use forwardRef to handle circular dependency
    AuthModule, // Provides JwtCookieGuard
  ],
  controllers: [RagController],
  providers: [FilesService, VectorStoreService],
  exports: [FilesService], // Export for ChatService and WorkspacesService to use
})
export class RagModule {}
