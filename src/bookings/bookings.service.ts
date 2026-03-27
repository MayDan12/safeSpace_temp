import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, EscrowStatus, TransactionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto, RescheduleBookingDto } from './dto/booking.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async requestBooking(userId: string, dto: CreateBookingDto) {
    const professionalProfile =
      await this.prisma.professionalProfile.findUnique({
        where: { id: dto.professionalId },
        select: { id: true, isVerified: true },
      });

    if (!professionalProfile || !professionalProfile.isVerified) {
      throw new NotFoundException('Professional profile not found');
    }

    const proposedAt =
      dto.proposedAt !== undefined ? new Date(dto.proposedAt) : undefined;

    if (proposedAt && Number.isNaN(proposedAt.getTime())) {
      throw new BadRequestException('Invalid proposedAt');
    }

    return this.prisma.booking.create({
      data: {
        userId,
        professionalId: dto.professionalId,
        proposedAt,
        notes: dto.notes,
        status: BookingStatus.PENDING,
      },
      select: {
        id: true,
        status: true,
        proposedAt: true,
        confirmedAt: true,
        completedAt: true,
        notes: true,
        createdAt: true,
      },
    });
  }

  async listOwnBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: {
        OR: [{ userId }, { professional: { userId } }],
      },
      select: {
        id: true,
        status: true,
        proposedAt: true,
        confirmedAt: true,
        completedAt: true,
        notes: true,
        createdAt: true,
        user: {
          select: { id: true, pseudonym: true },
        },
        professional: {
          select: {
            id: true,
            specialty: true,
            isVerified: true,
            user: { select: { id: true, pseudonym: true } },
          },
        },
        transaction: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            escrowStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBookingDetails(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        proposedAt: true,
        confirmedAt: true,
        completedAt: true,
        notes: true,
        createdAt: true,
        userId: true,
        professional: {
          select: {
            id: true,
            userId: true,
            specialty: true,
            isVerified: true,
            user: { select: { id: true, pseudonym: true } },
          },
        },
        user: {
          select: { id: true, pseudonym: true },
        },
        transaction: {
          select: {
            id: true,
            amount: true,
            currency: true,
            status: true,
            escrowStatus: true,
          },
        },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const isParticipant =
      booking.userId === userId || booking.professional.userId === userId;
    if (!isParticipant) {
      throw new ForbiddenException('Access denied');
    }

    return booking;
  }

  async acceptBooking(professionalUserId: string, bookingId: string) {
    const booking = await this.getBookingForProfessional(
      professionalUserId,
      bookingId,
    );

    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.RESCHEDULED
    ) {
      throw new BadRequestException('Booking cannot be accepted');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.ACCEPTED,
        confirmedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        proposedAt: true,
        confirmedAt: true,
        completedAt: true,
      },
    });
  }

  async declineBooking(professionalUserId: string, bookingId: string) {
    const booking = await this.getBookingForProfessional(
      professionalUserId,
      bookingId,
    );

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking cannot be declined');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.DECLINED,
      },
      select: { id: true, status: true },
    });

    await this.refundTransactionIfPresent(bookingId);

    return updated;
  }

  async rescheduleBooking(
    professionalUserId: string,
    bookingId: string,
    dto: RescheduleBookingDto,
  ) {
    await this.getBookingForProfessional(professionalUserId, bookingId);

    const proposedAt = new Date(dto.proposedAt);
    if (Number.isNaN(proposedAt.getTime())) {
      throw new BadRequestException('Invalid proposedAt');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.RESCHEDULED,
        proposedAt,
      },
      select: {
        id: true,
        status: true,
        proposedAt: true,
        confirmedAt: true,
        completedAt: true,
      },
    });
  }

  async completeBooking(professionalUserId: string, bookingId: string) {
    await this.getBookingForProfessional(professionalUserId, bookingId);

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
      },
      select: { id: true, status: true, completedAt: true },
    });

    try {
      await this.prisma.transaction.update({
        where: { bookingId },
        data: {
          status: TransactionStatus.COMPLETED,
          escrowStatus: EscrowStatus.RELEASED,
          payeeId: professionalUserId,
        },
      });
    } catch (error) {
      void error;
    }

    return updated;
  }

  async cancelBooking(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        userId: true,
        professional: { select: { userId: true } },
      },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const isParticipant =
      booking.userId === userId || booking.professional.userId === userId;
    if (!isParticipant) {
      throw new ForbiddenException('Access denied');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
      select: { id: true, status: true },
    });

    await this.refundTransactionIfPresent(bookingId);

    return updated;
  }

  private async getBookingForProfessional(
    professionalUserId: string,
    bookingId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        professional: { select: { userId: true } },
      },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.professional.userId !== professionalUserId) {
      throw new ForbiddenException('Access denied');
    }

    return booking;
  }

  private async refundTransactionIfPresent(bookingId: string) {
    await this.prisma.transaction
      .update({
        where: { bookingId },
        data: {
          status: TransactionStatus.REFUNDED,
          escrowStatus: EscrowStatus.REFUNDED,
        },
      })
      .catch(() => undefined);
  }
}
