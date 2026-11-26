import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../../identity/infrastructure/http/authenticated-request';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(request: Request, response: Response, next: NextFunction): void {
    const suppliedRequestId = request.get('x-request-id');
    const requestId =
      suppliedRequestId && /^[a-zA-Z0-9_-]{1,128}$/.test(suppliedRequestId)
        ? suppliedRequestId
        : randomUUID();
    const startedAt = process.hrtime.bigint();

    response.setHeader('x-request-id', requestId);
    response.once('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const authenticatedRequest = request as AuthenticatedRequest;
      const user = authenticatedRequest.user;

      this.logger.log(
        JSON.stringify({
          event: 'http_request',
          requestId,
          method: request.method,
          endpoint: this.getEndpoint(request),
          statusCode: response.statusCode,
          durationMs: Number(durationMs.toFixed(2)),
          userId: user?.sub ?? null,
          userRole: user?.role ?? null,
        }),
      );
    });

    next();
  }

  private getEndpoint(request: Request): string {
    const route = request.route as unknown as { path?: unknown } | undefined;
    const routePath = route?.path;

    if (typeof routePath === 'string') {
      return `${request.baseUrl}${routePath}`;
    }

    return request.path;
  }
}
