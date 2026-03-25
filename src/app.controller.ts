import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Public } from './auth/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  async health() {
    await this.prisma.$queryRaw`SELECT 1`; // throws if DB is unreachable
    return { status: 'ok', db: 'connected' };
  }
}
