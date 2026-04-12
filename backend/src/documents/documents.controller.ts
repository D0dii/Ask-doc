import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
  Param,
  Delete,
  UseGuards,
  Req,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { JwtCookieGuard } from '../auth/guards/jwt-cookie.guard';
import { KnowledgeHubAccessGuard } from '../knowledge-hubs/guards/knowledge-hub-access.guard';
import type { KnowledgeHubRequest } from '../auth/types/auth.types';
import { FileResponseDto } from './dtos/file-response.dto';
import { IngestResponseDto } from './dtos/ingest-response.dto';
import { FileStatus } from './entities/file.entity';
import { FilesService } from './services/files.service';

const ALLOWED_MIME_TYPES = ['application/pdf'];

@ApiTags('Documents')
@ApiCookieAuth()
@Controller('knowledge-hubs/:hubId/documents')
@ApiParam({ name: 'hubId', description: 'Knowledge Hub ID', type: String })
@UseGuards(JwtCookieGuard, KnowledgeHubAccessGuard)
export class DocumentsController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all documents in a knowledge hub' })
  @ApiResponse({
    status: 200,
    description: 'List of documents',
    type: [FileResponseDto],
  })
  async getFiles(@Req() req: KnowledgeHubRequest): Promise<FileResponseDto[]> {
    return this.filesService.getFilesByKnowledgeHub(req.knowledgeHub.id);
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Get a specific document by ID' })
  @ApiParam({ name: 'fileId', description: 'Document ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Document details',
    type: FileResponseDto,
  })
  async getFile(
    @Req() req: KnowledgeHubRequest,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<FileResponseDto> {
    const file = await this.filesService.getFileById(
      fileId,
      req.knowledgeHub.id,
    );
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload and ingest a PDF document' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF document to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Document upload started',
    type: IngestResponseDto,
  })
  async ingest(
    @Req() req: KnowledgeHubRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IngestResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Only PDF files are allowed. Received: ${file.mimetype}`,
      );
    }

    const savedFile = await this.filesService.createAndProcessFile(
      file,
      req.knowledgeHub.id,
    );

    return {
      message: 'Processing started',
      fileId: savedFile.id,
      status: FileStatus.PROCESSING,
    };
  }

  @Delete(':fileId')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiParam({ name: 'fileId', description: 'Document ID', type: String })
  async deleteFile(
    @Req() req: KnowledgeHubRequest,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<{ message: string }> {
    await this.filesService.deleteFile(fileId, req.knowledgeHub.id);
    return { message: 'File deleted successfully' };
  }
}
