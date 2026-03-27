import { Injectable } from '@nestjs/common';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { KycStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUsersDto: CreateUsersDto) {
    const { password, ...userData } = createUsersDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        ...userData,
        passwordHash: hashedPassword,
      },
    });
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        refreshTokenHash: hashedRefreshToken,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async updateKycStatus(id: string, kycStatus: KycStatus) {
    return this.prisma.user.update({
      where: { id },
      data: { kycStatus },
    });
  }

  update(id: string, updateUsersDto: UpdateUsersDto) {
    return this.prisma.user.update({
      where: {
        id,
      },
      data: {
        ...updateUsersDto,
      },
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({
      where: {
        id,
      },
    });
  }
}
