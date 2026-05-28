import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { KnowledgeHubsModule } from './knowledge-hubs/knowledge-hubs.module';
import { ChatModule } from './chat/chat.module';
import { DocumentsModule } from './documents/documents.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { RetrievalModule } from './retrieval/retrieval.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASS', ''),
        database: config.get<string>('DB_NAME', 'askdoc'),
        autoLoadEntities: true,
        synchronize: true, // dev only; switch to migrations in prod
      }),
    }),
    DocumentsModule,
    IngestionModule,
    RetrievalModule,
    AuthModule,
    KnowledgeHubsModule,
    ChatModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
