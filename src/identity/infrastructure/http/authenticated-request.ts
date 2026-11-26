import { Request } from 'express';
import { AuthTokenPayload } from '../../application/ports/token-service.port';

export type AuthenticatedRequest = Request & {
  user?: AuthTokenPayload;
};
