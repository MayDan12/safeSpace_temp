import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request as NestRequest,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateBookingDto, RescheduleBookingDto } from './dto/booking.dto';
import { BookingsService } from './bookings.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: Role;
  };
}

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Request a 1-on-1 session with a professional' })
  @ApiResponse({ status: 201, description: 'Booking requested' })
  requestBooking(
    @NestRequest() req: RequestWithUser,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.requestBooking(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List own bookings (user or professional view)' })
  @ApiResponse({ status: 200, description: 'List of bookings' })
  listOwn(@NestRequest() req: RequestWithUser) {
    return this.bookingsService.listOwnBookings(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  getDetails(
    @NestRequest() req: RequestWithUser,
    @Param('id') bookingId: string,
  ) {
    return this.bookingsService.getBookingDetails(req.user.id, bookingId);
  }

  @Patch(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Professional accepts booking' })
  @ApiResponse({ status: 200, description: 'Booking accepted' })
  accept(@NestRequest() req: RequestWithUser, @Param('id') bookingId: string) {
    return this.bookingsService.acceptBooking(req.user.id, bookingId);
  }

  @Patch(':id/decline')
  @UseGuards(RolesGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Professional declines booking' })
  @ApiResponse({ status: 200, description: 'Booking declined' })
  decline(@NestRequest() req: RequestWithUser, @Param('id') bookingId: string) {
    return this.bookingsService.declineBooking(req.user.id, bookingId);
  }

  @Patch(':id/reschedule')
  @UseGuards(RolesGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Propose a new time' })
  @ApiResponse({ status: 200, description: 'Booking rescheduled' })
  reschedule(
    @NestRequest() req: RequestWithUser,
    @Param('id') bookingId: string,
    @Body() dto: RescheduleBookingDto,
  ) {
    return this.bookingsService.rescheduleBooking(req.user.id, bookingId, dto);
  }

  @Patch(':id/complete')
  @UseGuards(RolesGuard)
  @Roles(Role.PROFESSIONAL)
  @ApiOperation({ summary: 'Mark session complete (triggers escrow release)' })
  @ApiResponse({ status: 200, description: 'Booking completed' })
  complete(
    @NestRequest() req: RequestWithUser,
    @Param('id') bookingId: string,
  ) {
    return this.bookingsService.completeBooking(req.user.id, bookingId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  cancel(@NestRequest() req: RequestWithUser, @Param('id') bookingId: string) {
    return this.bookingsService.cancelBooking(req.user.id, bookingId);
  }
}
