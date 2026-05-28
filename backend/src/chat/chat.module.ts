import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryController } from './controllers/query.controller';
import { ChatMessagesController } from './controllers/chat-messages.controller';
import { ChatThreadService } from './services/chat-thread.service';
import { QueryService } from './services/query.service';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatThread } from './entities/chat-thread.entity';
import { AuthModule } from '../auth/auth.module';
import { RetrievalModule } from '../retrieval/retrieval.module';
import { SharedModule } from '../shared/shared.module';
import { KnowledgeHubsModule } from '../knowledge-hubs/knowledge-hubs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage, ChatThread]),
    KnowledgeHubsModule,
    RetrievalModule,
    SharedModule,
    AuthModule,
  ],
  controllers: [QueryController, ChatMessagesController],
  providers: [ChatThreadService, QueryService],
  exports: [ChatThreadService, QueryService],
})
export class ChatModule {}
