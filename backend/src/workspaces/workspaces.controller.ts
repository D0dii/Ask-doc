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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { JwtCookieGuard } from '../auth/guards/jwt-cookie.guard';
import type { UserRequest } from '../auth/types/auth.types';
import { CreateWorkspaceDto } from './dtos/create-workspace.dto';
import { UpdateWorkspaceDto } from './dtos/update-workspace.dto';
import { WorkspaceResponseDto } from './dtos/workspace-response.dto';

@ApiTags('Workspaces')
@ApiCookieAuth()
@Controller('workspaces')
@UseGuards(JwtCookieGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workspace' })
  @ApiResponse({
    status: 201,
    description: 'Workspace created successfully',
    type: WorkspaceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Req() req: UserRequest, @Body() body: CreateWorkspaceDto) {
    const workspace = await this.workspacesService.create({
      name: body.name,
      description: body.description,
      ownerId: req.user.id,
    });
    return workspace;
  }

  @Get()
  @ApiOperation({ summary: 'Get all workspaces for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of workspaces',
    type: [WorkspaceResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Req() req: UserRequest) {
    return this.workspacesService.findAllByOwner(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific workspace by ID' })
  @ApiResponse({
    status: 200,
    description: 'Workspace details',
    type: WorkspaceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async findOne(@Req() req: UserRequest, @Param('id') id: string) {
    const workspace = await this.workspacesService.findOneByOwner(
      id,
      req.user.id,
    );
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a workspace' })
  @ApiResponse({
    status: 200,
    description: 'Workspace updated successfully',
    type: WorkspaceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async update(
    @Req() req: UserRequest,
    @Param('id') id: string,
    @Body() body: UpdateWorkspaceDto,
  ) {
    const workspace = await this.workspacesService.update(
      id,
      req.user.id,
      body,
    );
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    return workspace;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a workspace' })
  @ApiResponse({ status: 200, description: 'Workspace deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Workspace not found' })
  async remove(@Req() req: UserRequest, @Param('id') id: string) {
    const deleted = await this.workspacesService.remove(id, req.user.id);
    if (!deleted) {
      throw new NotFoundException('Workspace not found');
    }
    return { ok: true };
  }
}
