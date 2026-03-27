import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { KycStatus, IdType } from '@prisma/client';

@Injectable()
export class KycService {
  private interswitchClient: AxiosInstance;

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {
    this.interswitchClient = axios.create({
      baseURL:
        this.configService.get<string>('INTERSWITCH_BASE_URL') ||
        'https://api-marketplace-routing.k8.isw.la/marketplace-routing/api/v1/verify/identity',
    });
  }

  private async getInterswitchToken(): Promise<string> {
    const clientId = this.configService.get<string>('INTERSWITCH_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'INTERSWITCH_CLIENT_SECRET',
    );

    if (!clientId || !clientSecret) {
      if (process.env.NODE_ENV === 'production') {
        throw new InternalServerErrorException(
          'Interswitch credentials not set',
        );
      }
      return 'placeholder-token';
    }

    try {
      const response = await axios.post<{ access_token: string }>(
        `${this.configService.get<string>('INTERSWITCH_PASSPORT_URL') || 'https://qa.interswitchng.com'}/passport/oauth/token`,
        'grant_type=client_credentials&scope=profile',
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );
      return response.data.access_token;
    } catch {
      throw new InternalServerErrorException(
        'Failed to get Interswitch access token',
      );
    }
  }

  async verifyBvn(userId: string, bvn: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, dob: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const { firstName, lastName } = user;

    if (!firstName || !lastName) {
      throw new BadRequestException(
        'User profile is incomplete. First name and last name are required.',
      );
    }

    try {
      const token = await this.getInterswitchToken();
      const response = await this.interswitchClient.post<{
        success: boolean;
        code: string;
        message: string;
        data: {
          bvnStatus: {
            status: string;
          };
          [key: string]: any;
        };
      }>(
        '/bvn',
        {
          bvn,
          firstName,
          lastName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const isVerified =
        response.data.success &&
        response.data.data.bvnStatus.status === 'verified';

      await this.prisma.kycRecord.upsert({
        where: {
          id:
            (await this.findKycRecordId(userId, IdType.BVN)) || 'non-existent',
        },
        create: {
          userId,
          provider: 'INTERSWITCH',
          idType: IdType.BVN,
          idNumber: bvn,
          status: isVerified ? KycStatus.VERIFIED : KycStatus.FAILED,
          rawResponse: response.data as object,
          verifiedAt: isVerified ? new Date() : null,
        },
        update: {
          status: isVerified ? KycStatus.VERIFIED : KycStatus.FAILED,
          rawResponse: response.data as object,
          verifiedAt: isVerified ? new Date() : null,
        },
      });

      if (isVerified) {
        await this.usersService.updateKycStatus(userId, KycStatus.VERIFIED);
      }

      return { verified: isVerified, data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new BadRequestException(
          (error.response.data as { message?: string }).message ||
            'Interswitch verification failed',
        );
      }
      throw new InternalServerErrorException('KYC verification service error');
    }
  }

  async verifyNin(userId: string, nin: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, dob: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const { firstName, lastName } = user;

    if (!firstName || !lastName) {
      throw new BadRequestException(
        'User profile is incomplete. First name and last name are required.',
      );
    }

    try {
      const token = await this.getInterswitchToken();
      const response = await this.interswitchClient.post<{
        success: boolean;
        code: string;
        message: string;
        data: {
          ninStatus: {
            status: string;
          };
          [key: string]: any;
        };
      }>(
        '/nin',
        {
          nin,
          firstName,
          lastName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const isVerified =
        response.data.success &&
        response.data.data.ninStatus.status === 'verified';

      await this.prisma.kycRecord.upsert({
        where: {
          id:
            (await this.findKycRecordId(userId, IdType.NIN)) || 'non-existent',
        },
        create: {
          userId,
          provider: 'INTERSWITCH',
          idType: IdType.NIN,
          idNumber: nin,
          status: isVerified ? KycStatus.VERIFIED : KycStatus.FAILED,
          rawResponse: response.data as object,
          verifiedAt: isVerified ? new Date() : null,
        },
        update: {
          status: isVerified ? KycStatus.VERIFIED : KycStatus.FAILED,
          rawResponse: response.data as object,
          verifiedAt: isVerified ? new Date() : null,
        },
      });

      if (isVerified) {
        await this.usersService.updateKycStatus(userId, KycStatus.VERIFIED);
      }

      return { verified: isVerified, data: response.data };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new BadRequestException(
          (error.response.data as { message?: string }).message ||
            'Interswitch verification failed',
        );
      }
      throw new InternalServerErrorException('KYC verification service error');
    }
  }

  async getKycStatus(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');
    return { kycStatus: user.kycStatus };
  }

  async getKycRecord(userId: string) {
    const records = await this.prisma.kycRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return records;
  }

  async approveKyc(userId: string) {
    await this.usersService.updateKycStatus(userId, KycStatus.VERIFIED);
    return { message: 'KYC manually approved' };
  }

  async rejectKyc(userId: string, reason: string) {
    await this.usersService.updateKycStatus(userId, KycStatus.FAILED);
    // You might want to store the rejection reason in a record or send a notification
    return { message: 'KYC rejected', reason };
  }

  private async findKycRecordId(
    userId: string,
    idType: IdType,
  ): Promise<string | null> {
    const record = await this.prisma.kycRecord.findFirst({
      where: { userId, idType },
    });
    return record ? record.id : null;
  }
}
