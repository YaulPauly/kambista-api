import { Inject, Injectable } from '@nestjs/common';
import type { UserPublicProfile } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { InvalidCredentialsError } from '../errors/identity.errors';
import { PASSWORD_HASHER } from '../ports/password-hasher.port';
import type { PasswordHasher } from '../ports/password-hasher.port';
import { TOKEN_SERVICE } from '../ports/token-service.port';
import type {
  AuthTokenPayload,
  TokenService,
} from '../ports/token-service.port';
import { USER_REPOSITORY } from '../ports/user-repository.port';
import type { UserRepository } from '../ports/user-repository.port';

export interface LoginUserCommand {
  email: string;
  password: string;
}

export interface LoginUserResult {
  accessToken: string;
  user: UserPublicProfile;
}

@Injectable()
export class LoginUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LoginUserCommand): Promise<LoginUserResult> {
    const email = Email.create(command.email);
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await this.passwordHasher.compare(
      command.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const payload: AuthTokenPayload = {
      sub: user.id,
      name: user.name,
      email: user.email.value,
      role: user.role,
    };
    const accessToken = await this.tokenService.sign(payload);

    return {
      accessToken,
      user: user.toPublicProfile(),
    };
  }
}
