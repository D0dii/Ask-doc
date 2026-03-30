import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../documents/entities/file.entity';
import { SharedModule } from '../shared';
import { IngestionService } from './services/ingestion.service';

@Module({
  imports: [TypeOrmModule.forFeature([File]), SharedModule],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
