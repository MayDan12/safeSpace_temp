import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
  Request as NestRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { KycService } from './kyc.service';
import { VerifyBvnDto, VerifyNinDto, RejectKycDto } from './dto/verify-kyc.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from 'generated/prisma';
import { RolesGuard } from '../auth/guards/roles.guard';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@ApiTags('kyc')
@ApiBearerAuth()
@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('verify/bvn')
  @ApiOperation({ summary: 'Submit BVN for Interswitch identity verification' })
  @ApiResponse({ status: 200, description: 'BVN verification result' })
  verifyBvn(
    @NestRequest() req: RequestWithUser,
    @Body() verifyBvnDto: VerifyBvnDto,
  ) {
    return this.kycService.verifyBvn(req.user.id, verifyBvnDto.bvn);
  }

  @Post('verify/nin')
  @ApiOperation({ summary: 'Submit NIN for Interswitch identity verification' })
  @ApiResponse({ status: 200, description: 'NIN verification result' })
  verifyNin(
    @NestRequest() req: RequestWithUser,
    @Body() verifyNinDto: VerifyNinDto,
  ) {
    return this.kycService.verifyNin(req.user.id, verifyNinDto.nin);
  }

  @Get('status')
  @ApiOperation({ summary: "Get current user's KYC status" })
  @ApiResponse({ status: 200, description: 'Current KYC status' })
  getKycStatus(@NestRequest() req: RequestWithUser) {
    return this.kycService.getKycStatus(req.user.id);
  }

  @Get(':userId')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: view KYC record for a user' })
  @ApiResponse({ status: 200, description: 'KYC records for the user' })
  getKycRecord(@Param('userId') userId: string) {
    return this.kycService.getKycRecord(userId);
  }

  @Patch(':userId/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: manually approve KYC' })
  @ApiResponse({ status: 200, description: 'KYC manually approved' })
  approveKyc(@Param('userId') userId: string) {
    return this.kycService.approveKyc(userId);
  }

  @Patch(':userId/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: reject KYC with reason' })
  @ApiResponse({ status: 200, description: 'KYC rejected' })
  rejectKyc(
    @Param('userId') userId: string,
    @Body() rejectKycDto: RejectKycDto,
  ) {
    return this.kycService.rejectKyc(userId, rejectKycDto.reason);
  }
}
