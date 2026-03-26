import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  CreateGroupSessionDto,
  UpdateGroupSessionDto,
} from './dto/group.dto';
import { Role, GroupMemberRole, GroupSessionStatus } from 'generated/prisma';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(userId: string, createGroupDto: CreateGroupDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (
      user.role !== Role.VERIFIED_PERSON &&
      user.role !== Role.PROFESSIONAL &&
      user.role !== Role.ADMIN
    ) {
      throw new ForbiddenException(
        'Only Verified Persons or Professionals can create groups',
      );
    }

    return this.prisma.group.create({
      data: {
        ...createGroupDto,
        leaderId: userId,
        members: {
          create: {
            userId,
            role: GroupMemberRole.MODERATOR,
            hasPaid: true,
          },
        },
      },
    });
  }

  async findAllGroups() {
    return this.prisma.group.findMany({
      where: { isClosed: false },
      include: {
        _count: {
          select: { members: true },
        },
        leader: {
          select: {
            id: true,
            pseudonym: true,
          },
        },
      },
    });
  }

  async findOneGroup(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        leader: {
          select: { id: true, pseudonym: true },
        },
        _count: {
          select: { members: true, sessions: true },
        },
      },
    });

    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async updateGroup(id: string, userId: string, updateGroupDto: UpdateGroupDto) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.leaderId !== userId) {
      throw new ForbiddenException('Only the group leader can update the group');
    }

    return this.prisma.group.update({
      where: { id },
      data: updateGroupDto,
    });
  }

  async deleteGroup(id: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.leaderId !== userId) {
      throw new ForbiddenException('Only the group leader can delete the group');
    }

    return this.prisma.group.delete({ where: { id } });
  }

  async joinGroup(id: string, userId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });

    if (!group) throw new NotFoundException('Group not found');
    if (group.isClosed) throw new ForbiddenException('This group is closed');

    if (group.memberLimit && group._count.members >= group.memberLimit) {
      throw new ConflictException('Group is full');
    }

    const existingMember = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: id,
          userId,
        },
      },
    });

    if (existingMember) throw new ConflictException('Already a member');

    return this.prisma.groupMember.create({
      data: {
        groupId: id,
        userId,
        hasPaid: !group.requiresPayment,
      },
    });
  }

  async leaveGroup(id: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.leaderId === userId) {
      throw new BadRequestException('Leaders cannot leave their own group. Delete the group instead.');
    }

    return this.prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId: id,
          userId,
        },
      },
    });
  }

  async getMembers(id: string, userId: string) {
    const group = await this.prisma.group.findUnique({ where: { id } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.leaderId !== userId) {
      throw new ForbiddenException('Only the leader can list all members');
    }

    return this.prisma.groupMember.findMany({
      where: { groupId: id },
      include: {
        user: {
          select: {
            id: true,
            pseudonym: true,
            role: true,
          },
        },
      },
    });
  }

  async removeMember(groupId: string, targetUserId: string, leaderId: string) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.leaderId !== leaderId) {
      throw new ForbiddenException('Only the leader can remove members');
    }

    if (targetUserId === leaderId) {
      throw new BadRequestException('Cannot remove yourself as leader');
    }

    return this.prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: targetUserId,
        },
      },
    });
  }

  async createSession(groupId: string, userId: string, dto: CreateGroupSessionDto) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.leaderId !== userId) {
      throw new ForbiddenException('Only the leader can create sessions');
    }

    return this.prisma.groupSession.create({
      data: {
        ...dto,
        groupId,
        hostId: userId,
      },
    });
  }

  async listSessions(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });

    if (!member) throw new ForbiddenException('Only members can list sessions');

    return this.prisma.groupSession.findMany({
      where: { groupId },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async updateSession(
    groupId: string,
    sessionId: string,
    userId: string,
    dto: UpdateGroupSessionDto,
  ) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    if (group.leaderId !== userId) {
      throw new ForbiddenException('Only the leader can update sessions');
    }

    const session = await this.prisma.groupSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.groupId !== groupId) {
      throw new NotFoundException('Session not found in this group');
    }

    return this.prisma.groupSession.update({
      where: { id: sessionId },
      data: dto,
    });
  }
}
