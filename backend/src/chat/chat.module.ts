import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryController } from './controllers/query.controller';
import { ConversationsController } from './controllers/conversations.controller';
import { ConversationsService } from './services/conversations.service';
import { QueryService } from './services/query.service';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatConversation } from './entities/chat-conversation.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { AuthModule } from '../auth/auth.module';
import { RetrievalModule } from '../retrieval/retrieval.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, ChatConversation]),
    WorkspacesModule,
    RetrievalModule,
    AuthModule,
  ],
  controllers: [QueryController, ConversationsController],
  providers: [ConversationsService, QueryService],
  exports: [ConversationsService, QueryService],
})
export class ChatModule {}
