import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryController, ConversationsController } from './controllers';
import { ConversationsService, QueryService } from './services';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatConversation } from './entities/chat-conversation.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AuthModule } from '../auth/auth.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, ChatConversation]),
    forwardRef(() => WorkspacesModule),
    forwardRef(() => RagModule), // For search functionality
    AuthModule,
  ],
  controllers: [QueryController, ConversationsController],
  providers: [ConversationsService, QueryService],
  exports: [ConversationsService, QueryService],
})
export class ChatModule {}
