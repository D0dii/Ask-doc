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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { RagService } from './rag.service';
import { JwtCookieGuard } from '../auth/guards/jwt-cookie.guard';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import type { WorkspaceRequest } from '../auth/types/auth.types';
import { FileResponseDto, IngestResponseDto } from './dtos';
import { FileStatus } from './entities/file.entity';

const ALLOWED_MIME_TYPES = ['application/pdf'];

@ApiTags('RAG')
@ApiCookieAuth()
@Controller('workspaces/:workspaceId/files')
@UseGuards(JwtCookieGuard, WorkspaceAccessGuard)
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Get()
  @ApiOperation({ summary: 'Get all files in a workspace' })
  @ApiResponse({
    status: 200,
    description: 'List of files',
    type: [FileResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async getFiles(@Req() req: WorkspaceRequest): Promise<FileResponseDto[]> {
    return this.ragService.getFilesByWorkspace(req.workspace.id);
  }

  @Get(':fileId')
  @ApiOperation({ summary: 'Get a specific file by ID' })
  @ApiResponse({
    status: 200,
    description: 'File details',
    type: FileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async getFile(
    @Req() req: WorkspaceRequest,
    @Param('fileId') fileId: string,
  ): Promise<FileResponseDto> {
    const file = await this.ragService.getFileById(fileId, req.workspace.id);
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload and ingest a PDF file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to upload',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File upload started',
    type: IngestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - file is required or invalid file type',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async ingest(
    @Req() req: WorkspaceRequest,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<IngestResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Only PDF files are allowed. Received: ${file.mimetype}`,
      );
    }

    // Save file to DB and start processing (fire and forget)
    const savedFile = await this.ragService.createAndProcessFile(
      file,
      req.workspace.id,
    );

    return {
      message: 'Processing started',
      fileId: savedFile.id,
      status: FileStatus.PROCESSING,
    };
  }

  @Delete(':fileId')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async deleteFile(
    @Req() req: WorkspaceRequest,
    @Param('fileId') fileId: string,
  ): Promise<{ message: string }> {
    await this.ragService.deleteFile(fileId, req.workspace.id);
    return { message: 'File deleted successfully' };
  }
}
