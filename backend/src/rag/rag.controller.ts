import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RagService } from './rag.service';
import { v4 as uuidv4 } from 'uuid';

@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('ingest')
  @UseInterceptors(FileInterceptor('file'))
  async ingest(
    @UploadedFile() file: Express.Multer.File,
    @Body('sessionId') sessionId: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // 1. Generate a generic File ID (We will use a real DB later)
    const fileId = uuidv4();

    // 2. Trigger Ingestion
    // Note: For now, we await it to verify it works.
    // Later, we will remove 'await' for the "Fire and Forget" feature.
    console.log(file);
    await this.ragService.ingestFile(file.buffer, sessionId, fileId);

    return {
      message: 'Ingestion successful',
      fileId,
      chunksProcessed: 'Check server logs',
    };
  }
}
