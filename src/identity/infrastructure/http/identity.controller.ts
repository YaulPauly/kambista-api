import {
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import type { UserPublicProfile } from '../../domain/entities/user.entity';
import { InvalidEmailError } from '../../domain/value-objects/email.value-object';
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
} from '../../application/errors/identity.errors';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

interface PublicUserResponse {
  id: string;
  nombre: string;
  email: string;
  rol: UserPublicProfile['role'];
}

@Controller('v1/auth')
export class IdentityController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() request: RegisterUserDto) {
    try {
      const user = await this.registerUserUseCase.execute({
        name: request.nombre,
        email: request.email,
        password: request.password,
      });

      return { usuario: this.toPublicResponse(user) };
    } catch (error: unknown) {
      this.handleIdentityError(error);
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() request: LoginUserDto) {
    try {
      const result = await this.loginUserUseCase.execute(request);

      return {
        access_token: result.accessToken,
        usuario: this.toPublicResponse(result.user),
      };
    } catch (error: unknown) {
      this.handleIdentityError(error);
    }
  }

  private toPublicResponse(user: UserPublicProfile): PublicUserResponse {
    return {
      id: user.id,
      nombre: user.name,
      email: user.email,
      rol: user.role,
    };
  }

  private handleIdentityError(error: unknown): never {
    if (error instanceof EmailAlreadyRegisteredError) {
      throw new ConflictException('El email ya está registrado.');
    }

    if (error instanceof InvalidCredentialsError) {
      throw new UnauthorizedException('Las credenciales no son válidas.');
    }

    if (error instanceof InvalidEmailError) {
      throw new BadRequestException('El email no es válido.');
    }

    throw error;
  }
}
