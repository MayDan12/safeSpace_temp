import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL!,
      }),
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
