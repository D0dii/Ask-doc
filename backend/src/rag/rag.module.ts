import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagController } from './rag.controller';
import { QueryController } from './query.controller';
import { RagService } from './rag.service';
import { File } from './entities/file.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([File]),
    forwardRef(() => WorkspacesModule), // Use forwardRef to handle circular dependency
    AuthModule, // Provides JwtCookieGuard
  ],
  controllers: [RagController, QueryController],
  providers: [RagService],
  exports: [RagService], // Export for WorkspacesService to use
})
export class RagModule {}
