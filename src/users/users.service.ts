import { Injectable } from '@nestjs/common';
import { CreateUsersDto } from './dto/create-users.dto';
import { UpdateUsersDto } from './dto/update-users.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

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

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
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
