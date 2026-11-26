import { Logger } from '@nestjs/common';
import { RequestLoggingMiddleware } from './request-logging.middleware';

describe('RequestLoggingMiddleware', () => {
  it('logs request context without sensitive user data', () => {
    const loggerSpy = jest
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const finishListeners: Array<() => void> = [];
    const request = {
      get: jest.fn().mockReturnValue(undefined),
      method: 'GET',
      path: '/v1/transactions/history',
      baseUrl: '',
      route: { path: '/v1/transactions/history' },
      user: {
        sub: 'user-id',
        name: 'Private User',
        email: 'private@example.com',
        role: 'user',
      },
    };
    const response = {
      statusCode: 200,
      setHeader: jest.fn(),
      once: jest.fn((event: string, listener: () => void) => {
        if (event === 'finish') {
          finishListeners.push(listener);
        }
      }),
    };
    const next = jest.fn();

    new RequestLoggingMiddleware().use(
      request as never,
      response as never,
      next,
    );
    finishListeners.forEach((listener) => listener());

    const logPayload = JSON.parse(loggerSpy.mock.calls[0]?.[0] as string) as {
      event: string;
      endpoint: string;
      method: string;
      statusCode: number;
      durationMs: number;
      userId: string;
      userRole: string;
      email?: string;
    };

    expect(logPayload).toMatchObject({
      event: 'http_request',
      endpoint: '/v1/transactions/history',
      method: 'GET',
      statusCode: 200,
      userId: 'user-id',
      userRole: 'user',
    });
    expect(typeof logPayload.durationMs).toBe('number');
    expect(logPayload).not.toHaveProperty('email');
    expect(next).toHaveBeenCalledTimes(1);
  });
});
