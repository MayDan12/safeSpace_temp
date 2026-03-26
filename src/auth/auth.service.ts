import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { CreateUsersDto } from '../users/dto/create-users.dto';
import { RefreshDto } from './dto/refresh.dto';

type JwtPayload = {
  sub: string;
  email: string;
  role: string;
};
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUsersDto: CreateUsersDto) {
    const existingUser = await this.usersService.findByEmail(
      createUsersDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const user = await this.usersService.create(createUsersDto);
    return this.login({ email: user.email, password: createUsersDto.password });
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };

    const access_token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });

    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7d',
    });

    // 🔐 Store hashed refresh token in DB
    await this.usersService.updateRefreshToken(
      user.id,
      await bcrypt.hash(refresh_token, 10),
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        pseudonym: user.pseudonym,
      },
    };
  }

  async refresh(refreshDto: RefreshDto) {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refreshDto.refreshToken,
      );

      const user = await this.usersService.findByEmail(payload.email);

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isMatch = await bcrypt.compare(
        refreshDto.refreshToken,
        user.refreshTokenHash,
      );

      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      return {
        access_token: await this.jwtService.signAsync(newPayload, {
          expiresIn: '15m',
        }),
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    return { message: 'User successfully logged out' };
  }
}
