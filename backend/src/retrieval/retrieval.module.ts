import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../documents/entities/file.entity';
import { SemanticSearchService } from './services/semantic-search.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([File]), SharedModule],
  providers: [SemanticSearchService],
  exports: [SemanticSearchService],
})
export class RetrievalModule {}
