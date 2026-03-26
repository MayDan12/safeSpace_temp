import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  CreateGroupSessionDto,
  UpdateGroupSessionDto,
} from './dto/group.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('groups')
@ApiBearerAuth()
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  @ApiOperation({ summary: 'List public groups' })
  @ApiResponse({ status: 200, description: 'List of groups' })
  findAll() {
    return this.groupsService.findAllGroups();
  }

  @Post()
  @ApiOperation({ summary: 'Create a group (Verified/Professional)' })
  @ApiResponse({ status: 201, description: 'Group created' })
  create(@Request() req: RequestWithUser, @Body() createGroupDto: CreateGroupDto) {
    return this.groupsService.createGroup(req.user.id, createGroupDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group details' })
  @ApiResponse({ status: 200, description: 'Group details' })
  findOne(@Param('id') id: string) {
    return this.groupsService.findOneGroup(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update group info (Leader)' })
  @ApiResponse({ status: 200, description: 'Group updated' })
  update(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    return this.groupsService.updateGroup(id, req.user.id, updateGroupDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete group (Leader)' })
  @ApiResponse({ status: 200, description: 'Group deleted' })
  remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.groupsService.deleteGroup(id, req.user.id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join a public group' })
  @ApiResponse({ status: 201, description: 'Joined group' })
  join(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.groupsService.joinGroup(id, req.user.id);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave a group' })
  @ApiResponse({ status: 200, description: 'Left group' })
  leave(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.groupsService.leaveGroup(id, req.user.id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List group members (Leader)' })
  @ApiResponse({ status: 200, description: 'List of members' })
  getMembers(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.groupsService.getMembers(id, req.user.id);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove a member (Leader)' })
  @ApiResponse({ status: 200, description: 'Member removed' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') targetUserId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.groupsService.removeMember(id, targetUserId, req.user.id);
  }

  @Post(':id/sessions')
  @ApiOperation({ summary: 'Create a group session (Leader)' })
  @ApiResponse({ status: 201, description: 'Session created' })
  createSession(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() createSessionDto: CreateGroupSessionDto,
  ) {
    return this.groupsService.createSession(id, req.user.id, createSessionDto);
  }

  @Get(':id/sessions')
  @ApiOperation({ summary: 'List sessions in a group (Member)' })
  @ApiResponse({ status: 200, description: 'List of sessions' })
  listSessions(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.groupsService.listSessions(id, req.user.id);
  }

  @Patch(':id/sessions/:sessionId')
  @ApiOperation({ summary: 'Update/close a session (Leader)' })
  @ApiResponse({ status: 200, description: 'Session updated' })
  updateSession(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
    @Request() req: RequestWithUser,
    @Body() updateSessionDto: UpdateGroupSessionDto,
  ) {
    return this.groupsService.updateSession(id, sessionId, req.user.id, updateSessionDto);
  }
}
