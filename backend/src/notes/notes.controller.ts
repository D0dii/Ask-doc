import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtCookieGuard } from '../auth/guards/jwt-cookie.guard';
import { KnowledgeHubAccessGuard } from '../knowledge-hubs/guards/knowledge-hub-access.guard';
import type { KnowledgeHubRequest } from '../auth/types/auth.types';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dtos/create-note.dto';
import { UpdateNoteDto } from './dtos/update-note.dto';
import { GenerateNoteDto } from './dtos/generate-note.dto';

@ApiTags('Notes')
@ApiCookieAuth()
@Controller('knowledge-hubs/:hubId/notes')
@ApiParam({ name: 'hubId', description: 'Knowledge Hub ID', type: String })
@UseGuards(JwtCookieGuard, KnowledgeHubAccessGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a manual note' })
  @ApiResponse({ status: 201, description: 'Note created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Req() req: KnowledgeHubRequest, @Body() body: CreateNoteDto) {
    return this.notesService.create({
      knowledgeHubId: req.knowledgeHub.id,
      ownerId: req.user.id,
      title: body.title,
      content: body.content,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List notes in a knowledge hub' })
  @ApiResponse({ status: 200, description: 'Notes list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Req() req: KnowledgeHubRequest) {
    return this.notesService.findAllByKnowledgeHub(
      req.knowledgeHub.id,
      req.user.id,
    );
  }

  @Get(':noteId')
  @ApiOperation({ summary: 'Get a note by ID' })
  @ApiResponse({ status: 200, description: 'Note details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async findOne(
    @Req() req: KnowledgeHubRequest,
    @Param('noteId', ParseUUIDPipe) noteId: string,
  ) {
    const note = await this.notesService.findOneById(
      noteId,
      req.knowledgeHub.id,
      req.user.id,
    );

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  @Patch(':noteId')
  @ApiOperation({ summary: 'Update a note' })
  @ApiResponse({ status: 200, description: 'Note updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async update(
    @Req() req: KnowledgeHubRequest,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() body: UpdateNoteDto,
  ) {
    const note = await this.notesService.update(
      noteId,
      req.knowledgeHub.id,
      req.user.id,
      body,
    );

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  @Delete(':noteId')
  @ApiOperation({ summary: 'Delete a note' })
  @ApiResponse({ status: 200, description: 'Note deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Note not found' })
  async remove(
    @Req() req: KnowledgeHubRequest,
    @Param('noteId', ParseUUIDPipe) noteId: string,
  ) {
    const deleted = await this.notesService.remove(
      noteId,
      req.knowledgeHub.id,
      req.user.id,
    );

    if (!deleted) {
      throw new NotFoundException('Note not found');
    }

    return { ok: true };
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a note from contextual input' })
  @ApiResponse({ status: 201, description: 'Note generated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generate(
    @Req() req: KnowledgeHubRequest,
    @Body() body: GenerateNoteDto,
  ) {
    return this.notesService.generate(req.knowledgeHub.id, req.user.id, body);
  }
}
