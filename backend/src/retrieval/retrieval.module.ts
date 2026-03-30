import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../documents/entities/file.entity';
import { RetrievalService } from './services/retrieval.service';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [TypeOrmModule.forFeature([File]), SharedModule],
  providers: [RetrievalService],
  exports: [RetrievalService],
})
export class RetrievalModule {}
