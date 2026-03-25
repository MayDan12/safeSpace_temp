import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { UpdateUsersDto } from './dto/update-users.dto';
import { CreateUsersDto } from './dto/create-users.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users') // /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (Admin/Internal)' })
  create(@Body() createUsersDto: CreateUsersDto) {
    return this.usersService.create(createUsersDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() updateUsersDto: UpdateUsersDto) {
    return this.usersService.update(id, updateUsersDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
