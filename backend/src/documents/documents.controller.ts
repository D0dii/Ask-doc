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
  ApiParam,
} from '@nestjs/swagger';
import { JwtCookieGuard } from '../auth/guards/jwt-cookie.guard';
import { WorkspaceAccessGuard } from '../workspaces/guards/workspace-access.guard';
import type { WorkspaceRequest } from '../auth/types/auth.types';
import { FileResponseDto } from './dtos/file-response.dto';
import { IngestResponseDto } from './dtos/ingest-response.dto';
import { FileStatus } from './entities/file.entity';
import { FilesService } from './services/files.service';

const ALLOWED_MIME_TYPES = ['application/pdf'];

@ApiTags('Documents')
@ApiCookieAuth()
@Controller('workspaces/:workspaceId/documents')
@ApiParam({ name: 'workspaceId', description: 'Workspace ID', type: String })
@UseGuards(JwtCookieGuard, WorkspaceAccessGuard)
export class DocumentsController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all documents in a workspace' })
  @ApiResponse({
    status: 200,
    description: 'List of documents',
    type: [FileResponseDto],
  })
  async getFiles(@Req() req: WorkspaceRequest): Promise<FileResponseDto[]> {
    return this.filesService.getFilesByWorkspace(req.workspace.id);
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
    @Req() req: WorkspaceRequest,
    @Param('fileId') fileId: string,
  ): Promise<FileResponseDto> {
    const file = await this.filesService.getFileById(fileId, req.workspace.id);
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
    @Req() req: WorkspaceRequest,
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
      req.workspace.id,
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
    @Req() req: WorkspaceRequest,
    @Param('fileId') fileId: string,
  ): Promise<{ message: string }> {
    await this.filesService.deleteFile(fileId, req.workspace.id);
    return { message: 'File deleted successfully' };
  }
}
