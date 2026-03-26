import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { GroupSessionType, GroupSessionStatus } from 'generated/prisma';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresPayment?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  entryFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  memberLimit?: number;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresPayment?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  entryFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  memberLimit?: number;
}

export class CreateGroupSessionDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsEnum(GroupSessionType)
  type?: GroupSessionType;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class UpdateGroupSessionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(GroupSessionType)
  type?: GroupSessionType;

  @IsOptional()
  @IsEnum(GroupSessionStatus)
  status?: GroupSessionStatus;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsDateString()
  endedAt?: string;
}
