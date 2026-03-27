import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let app: TestingModule;
  let prismaService: { $queryRaw: jest.Mock };

  beforeAll(async () => {
    prismaService = {
      $queryRaw: jest.fn().mockResolvedValue(1),
    };

    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prismaService }],
    }).compile();
  });

  it('should return health response', async () => {
    const appController = app.get(AppController);
    await expect(appController.health()).resolves.toEqual({
      status: 'ok',
      db: 'connected',
    });
    expect(prismaService.$queryRaw).toHaveBeenCalled();
  });
});
