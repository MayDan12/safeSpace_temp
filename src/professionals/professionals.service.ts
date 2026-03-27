import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessionalProfileDto } from './dto/professional-profile.dto';
import { UpdateProfessionalProfileDto } from './dto/professional-profile.dto';
import { Role } from '@prisma/client';

@Injectable()
export class ProfessionalsService {
  constructor(private prisma: PrismaService) {}

  async listVerifiedProfessionals(specialty?: string) {
    return this.prisma.professionalProfile.findMany({
      where: {
        isVerified: true,
        ...(specialty
          ? { specialty: { contains: specialty, mode: 'insensitive' } }
          : {}),
      },
      select: {
        id: true,
        bio: true,
        specialty: true,
        availabilityNote: true,
        contactPreference: true,
        isVerified: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            pseudonym: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVerifiedProfessionalProfile(professionalUserId: string) {
    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId: professionalUserId },
      select: {
        id: true,
        bio: true,
        specialty: true,
        availabilityNote: true,
        contactPreference: true,
        isVerified: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            pseudonym: true,
          },
        },
      },
    });

    if (!profile || !profile.isVerified) {
      throw new NotFoundException('Professional profile not found');
    }

    return profile;
  }

  async submitProfessionalProfile(
    userId: string,
    dto: CreateProfessionalProfileDto,
  ) {
    const existing = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Professional profile already exists');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.role !== Role.PROFESSIONAL && user.role !== Role.ADMIN) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: Role.PROFESSIONAL },
      });
    }

    return this.prisma.professionalProfile.create({
      data: {
        userId,
        bio: dto.bio,
        specialty: dto.specialty,
        availabilityNote: dto.availabilityNote,
        contactPreference: dto.contactPreference,
        isVerified: false,
      },
      select: {
        id: true,
        bio: true,
        specialty: true,
        availabilityNote: true,
        contactPreference: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  async updateOwnProfessionalProfile(
    userId: string,
    dto: UpdateProfessionalProfileDto,
  ) {
    const existing = await this.prisma.professionalProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Professional profile not found');
    }

    return this.prisma.professionalProfile.update({
      where: { userId },
      data: {
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
        ...(dto.specialty !== undefined ? { specialty: dto.specialty } : {}),
        ...(dto.availabilityNote !== undefined
          ? { availabilityNote: dto.availabilityNote }
          : {}),
        ...(dto.contactPreference !== undefined
          ? { contactPreference: dto.contactPreference }
          : {}),
      },
      select: {
        id: true,
        bio: true,
        specialty: true,
        availabilityNote: true,
        contactPreference: true,
        isVerified: true,
        createdAt: true,
      },
    });
  }

  async sendConnectionRequest(fromUserId: string, professionalUserId: string) {
    if (fromUserId === professionalUserId) {
      throw new BadRequestException('You cannot connect to yourself');
    }

    const profile = await this.prisma.professionalProfile.findUnique({
      where: { userId: professionalUserId },
      select: { id: true, isVerified: true },
    });

    if (!profile || !profile.isVerified) {
      throw new NotFoundException('Professional profile not found');
    }

    return { message: 'Connection request sent' };
  }
}
