import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { JwtCookieGuard } from '../auth/guards/jwt-cookie.guard';
import type { UserRequest } from '../auth/types/auth.types';
import { KnowledgeHubsService } from './knowledge-hubs.service';
import { CreateKnowledgeHubDto } from './dtos/create-knowledge-hub.dto';
import { UpdateKnowledgeHubDto } from './dtos/update-knowledge-hub.dto';
import { KnowledgeHubResponseDto } from './dtos/knowledge-hub-response.dto';

@ApiTags('Knowledge Hubs')
@ApiCookieAuth()
@Controller('knowledge-hubs')
@UseGuards(JwtCookieGuard)
export class KnowledgeHubsController {
  constructor(private readonly knowledgeHubsService: KnowledgeHubsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new knowledge hub' })
  @ApiResponse({
    status: 201,
    description: 'Knowledge hub created successfully',
    type: KnowledgeHubResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Req() req: UserRequest, @Body() body: CreateKnowledgeHubDto) {
    return this.knowledgeHubsService.create({
      name: body.name,
      description: body.description,
      ownerId: req.user.id,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all knowledge hubs for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of knowledge hubs',
    type: [KnowledgeHubResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Req() req: UserRequest) {
    return this.knowledgeHubsService.findAllByOwner(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific knowledge hub by ID' })
  @ApiResponse({
    status: 200,
    description: 'Knowledge hub details',
    type: KnowledgeHubResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Knowledge hub not found' })
  async findOne(
    @Req() req: UserRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const knowledgeHub = await this.knowledgeHubsService.findOneByOwner(
      id,
      req.user.id,
    );
    if (!knowledgeHub) {
      throw new NotFoundException('Knowledge hub not found');
    }
    return knowledgeHub;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a knowledge hub' })
  @ApiResponse({
    status: 200,
    description: 'Knowledge hub updated successfully',
    type: KnowledgeHubResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Knowledge hub not found' })
  async update(
    @Req() req: UserRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateKnowledgeHubDto,
  ) {
    const knowledgeHub = await this.knowledgeHubsService.update(
      id,
      req.user.id,
      body,
    );
    if (!knowledgeHub) {
      throw new NotFoundException('Knowledge hub not found');
    }
    return knowledgeHub;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a knowledge hub' })
  @ApiResponse({
    status: 200,
    description: 'Knowledge hub deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Knowledge hub not found' })
  async remove(
    @Req() req: UserRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const deleted = await this.knowledgeHubsService.remove(id, req.user.id);
    if (!deleted) {
      throw new NotFoundException('Knowledge hub not found');
    }
    return { ok: true };
  }
}
