import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request as NestRequest,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  CreateProfessionalProfileDto,
  UpdateProfessionalProfileDto,
} from './dto/professional-profile.dto';
import { ProfessionalsService } from './professionals.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@ApiTags('professionals')
@ApiBearerAuth()
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  @ApiOperation({
    summary: 'List verified professionals (filterable by specialty)',
  })
  @ApiQuery({ name: 'specialty', required: false })
  @ApiResponse({
    status: 200,
    description: 'List of verified professionals',
  })
  list(@Query('specialty') specialty?: string) {
    return this.professionalsService.listVerifiedProfessionals(specialty);
  }

  @Get(':id')
  @ApiOperation({ summary: 'View professional profile' })
  @ApiResponse({ status: 200, description: 'Professional profile' })
  view(@Param('id') professionalUserId: string) {
    return this.professionalsService.getVerifiedProfessionalProfile(
      professionalUserId,
    );
  }

  @Post('profile')
  @ApiOperation({
    summary: 'Submit professional profile (triggers verification)',
  })
  @ApiResponse({ status: 201, description: 'Professional profile submitted' })
  submitProfile(
    @NestRequest() req: RequestWithUser,
    @Body() dto: CreateProfessionalProfileDto,
  ) {
    return this.professionalsService.submitProfessionalProfile(
      req.user.id,
      dto,
    );
  }

  @Patch('profile')
  @UseGuards(RolesGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Update own professional profile' })
  @ApiResponse({ status: 200, description: 'Professional profile updated' })
  updateProfile(
    @NestRequest() req: RequestWithUser,
    @Body() dto: UpdateProfessionalProfileDto,
  ) {
    return this.professionalsService.updateOwnProfessionalProfile(
      req.user.id,
      dto,
    );
  }

  @Post(':id/connect')
  @ApiOperation({ summary: 'Send connection request (MVP)' })
  @ApiResponse({ status: 200, description: 'Connection request sent' })
  connect(
    @NestRequest() req: RequestWithUser,
    @Param('id') professionalUserId: string,
  ) {
    return this.professionalsService.sendConnectionRequest(
      req.user.id,
      professionalUserId,
    );
  }
}
