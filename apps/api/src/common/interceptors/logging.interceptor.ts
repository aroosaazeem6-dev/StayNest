import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request: Request = ctx.getRequest<Request>();
    const response: Response = ctx.getResponse<Response>();

    const { method, url } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `${method} ${url} ${response.statusCode} - ${duration}ms`,
          );
        },
        error: (err: Error) => {
          const duration = Date.now() - startTime;
          const status = response.statusCode;
          this.logger.error(
            `${method} ${url} ${status} - ${duration}ms`,
            err instanceof Error ? err.stack : undefined,
          );
        },
      }),
    );
  }
}