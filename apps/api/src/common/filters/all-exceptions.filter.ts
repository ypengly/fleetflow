import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException ? exception.getResponse() : 'Internal server error';

    const code =
      typeof message === 'object' && message !== null && 'code' in (message as Record<string, unknown>)
        ? (message as Record<string, unknown>).code
        : HttpStatus[status] ?? 'INTERNAL_ERROR';

    response.status(status).json({
      error: {
        code,
        message: typeof message === 'string' ? message : (message as { message?: string })?.message ?? 'Error',
        requestId: (request as any).id,
      },
    });
  }
}
