import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import * as bcrypt from 'bcrypt';
import { CreateUserCommand } from '@/user/commands/create-user.command';
import { GetUserByEmailQuery } from '@/user/queries/get-user-by-email.query';
import { UserMapper } from '@/user/user.mapper';
import { AuthResponse, JwtPayload, UserPublic } from '@expence-tracker/shared-types';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    // CreateUserCommand handler already returns UserPublic
    const user = await this.commandBus.execute<CreateUserCommand, UserPublic>(
      new CreateUserCommand(dto.email, dto.name, passwordHash),
    );
    const accessToken = this.signToken(user);
    return { user, accessToken };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const rawUser = await this.queryBus.execute(new GetUserByEmailQuery(dto.email));
    const passwordValid =
      rawUser != null && (await bcrypt.compare(dto.password, rawUser.passwordHash));
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const user = UserMapper.toPublic(rawUser);
    const accessToken = this.signToken(user);
    return { user, accessToken };
  }

  private signToken(user: UserPublic): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }
}
