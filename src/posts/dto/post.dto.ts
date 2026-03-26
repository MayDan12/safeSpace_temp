import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { PostDestination } from 'generated/prisma';

export class CreatePostDto {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsEnum(PostDestination)
  destination?: PostDestination;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}

export class ToggleCommentsDto {
  @IsNotEmpty()
  @IsBoolean()
  commentsEnabled: boolean;
}

export class ReportPostDto {
  @IsNotEmpty()
  @IsString()
  reason: string;
}
