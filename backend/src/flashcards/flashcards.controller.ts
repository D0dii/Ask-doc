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
import { FlashcardsService } from './flashcards.service';
import { CreateFlashcardDto } from './dtos/create-flashcard.dto';
import { UpdateFlashcardDto } from './dtos/update-flashcard.dto';
import { GenerateFlashcardDto } from './dtos/generate-flashcard.dto';

@ApiTags('Flashcards')
@ApiCookieAuth()
@Controller('knowledge-hubs/:hubId/flashcards')
@ApiParam({ name: 'hubId', description: 'Knowledge Hub ID', type: String })
@UseGuards(JwtCookieGuard, KnowledgeHubAccessGuard)
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a manual flashcard' })
  @ApiResponse({ status: 201, description: 'Flashcard created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(
    @Req() req: KnowledgeHubRequest,
    @Body() body: CreateFlashcardDto,
  ) {
    return this.flashcardsService.create({
      knowledgeHubId: req.knowledgeHub.id,
      ownerId: req.user.id,
      front: body.front,
      back: body.back,
    });
  }

  @Get()
  @ApiOperation({ summary: 'List flashcards in a knowledge hub' })
  @ApiResponse({ status: 200, description: 'Flashcards list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Req() req: KnowledgeHubRequest) {
    return this.flashcardsService.findAllByKnowledgeHub(
      req.knowledgeHub.id,
      req.user.id,
    );
  }

  @Get(':flashcardId')
  @ApiOperation({ summary: 'Get a flashcard by ID' })
  @ApiResponse({ status: 200, description: 'Flashcard details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Flashcard not found' })
  async findOne(
    @Req() req: KnowledgeHubRequest,
    @Param('flashcardId', ParseUUIDPipe) flashcardId: string,
  ) {
    const flashcard = await this.flashcardsService.findOneById(
      flashcardId,
      req.knowledgeHub.id,
      req.user.id,
    );

    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }

    return flashcard;
  }

  @Patch(':flashcardId')
  @ApiOperation({ summary: 'Update a flashcard' })
  @ApiResponse({ status: 200, description: 'Flashcard updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Flashcard not found' })
  async update(
    @Req() req: KnowledgeHubRequest,
    @Param('flashcardId', ParseUUIDPipe) flashcardId: string,
    @Body() body: UpdateFlashcardDto,
  ) {
    const flashcard = await this.flashcardsService.update(
      flashcardId,
      req.knowledgeHub.id,
      req.user.id,
      body,
    );

    if (!flashcard) {
      throw new NotFoundException('Flashcard not found');
    }

    return flashcard;
  }

  @Delete(':flashcardId')
  @ApiOperation({ summary: 'Delete a flashcard' })
  @ApiResponse({ status: 200, description: 'Flashcard deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Flashcard not found' })
  async remove(
    @Req() req: KnowledgeHubRequest,
    @Param('flashcardId', ParseUUIDPipe) flashcardId: string,
  ) {
    const deleted = await this.flashcardsService.remove(
      flashcardId,
      req.knowledgeHub.id,
      req.user.id,
    );

    if (!deleted) {
      throw new NotFoundException('Flashcard not found');
    }

    return { ok: true };
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate flashcards from contextual input' })
  @ApiResponse({
    status: 201,
    description: 'Flashcards generated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generate(
    @Req() req: KnowledgeHubRequest,
    @Body() body: GenerateFlashcardDto,
  ) {
    return this.flashcardsService.generate(
      req.knowledgeHub.id,
      req.user.id,
      body,
    );
  }
}
