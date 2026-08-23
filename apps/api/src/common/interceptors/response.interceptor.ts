import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UseInterceptors,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

export const SKIP_RESPONSE_INTERCEPTOR = 'skipResponseInterceptor';
export const SkipResponseInterceptor = () => UseInterceptors(ResponseInterceptor);

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<unknown>> {
    const skip = this.reflector.get<boolean>(
      SKIP_RESPONSE_INTERCEPTOR,
      context.getHandler(),
    );

    if (skip) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: unknown) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}