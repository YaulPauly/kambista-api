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
import { SkipThrottle } from '@nestjs/throttler';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { UserPublicProfile } from '../../domain/entities/user.entity';
import { InvalidEmailError } from '../../domain/value-objects/email.value-object';
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../../application/errors/identity.errors';
import { LoginUserUseCase } from '../../application/use-cases/login-user.use-case';
import { RefreshUserUseCase } from '../../application/use-cases/refresh-user.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  LoginUserResponseDto,
  PublicUserResponseDto,
  RegisterUserResponseDto,
} from './dto/identity-response.dto';

@ApiTags('identity')
@Controller('v1/auth')
@SkipThrottle()
export class IdentityController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly refreshUserUseCase: RefreshUserUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un usuario' })
  @ApiCreatedResponse({ type: RegisterUserResponseDto })
  @ApiBadRequestResponse({ description: 'Los datos enviados no son válidos.' })
  @ApiConflictResponse({ description: 'El email ya está registrado.' })
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
  @SkipThrottle({ default: false })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiOkResponse({ type: LoginUserResponseDto })
  @ApiBadRequestResponse({ description: 'Los datos enviados no son válidos.' })
  @ApiUnauthorizedResponse({ description: 'Las credenciales no son válidas.' })
  async login(@Body() request: LoginUserDto) {
    try {
      const result = await this.loginUserUseCase.execute(request);

      return {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        usuario: this.toPublicResponse(result.user),
      };
    } catch (error: unknown) {
      this.handleIdentityError(error);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar los tokens de sesión' })
  @ApiOkResponse({ type: LoginUserResponseDto })
  @ApiBadRequestResponse({ description: 'El refresh token es obligatorio.' })
  @ApiUnauthorizedResponse({ description: 'El refresh token no es válido.' })
  async refresh(@Body() request: RefreshTokenDto) {
    try {
      const result = await this.refreshUserUseCase.execute({
        refreshToken: request.refresh_token,
      });

      return {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        usuario: this.toPublicResponse(result.user),
      };
    } catch (error: unknown) {
      this.handleIdentityError(error);
    }
  }

  private toPublicResponse(user: UserPublicProfile): PublicUserResponseDto {
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

    if (error instanceof InvalidRefreshTokenError) {
      throw new UnauthorizedException('El refresh token no es válido.');
    }

    if (error instanceof InvalidEmailError) {
      throw new BadRequestException('El email no es válido.');
    }

    throw error;
  }
}
