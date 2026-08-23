import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown[];
  };
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response: Response = http.getResponse<Response>();
    const request: Request = http.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = 'INTERNAL_SERVER_ERROR';
    let message: string = 'An internal server error occurred';
    let details: unknown[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseBody = exception.getResponse();
      const resp =
        typeof responseBody === 'object' && responseBody !== null
          ? (responseBody as Record<string, unknown>)
          : { message: String(responseBody) };

      const statusKey = Object.keys(HttpStatus).find(
        (k) => HttpStatus[k as keyof typeof HttpStatus] === status,
      );
      code = statusKey || exception.constructor.name.replace('Exception', '').toUpperCase();
      message = exception.message;

      if ('message' in resp) {
        const resMsg = resp['message'];
        if (Array.isArray(resMsg)) {
          details = resMsg.map((m) => (typeof m === 'string' ? { message: m } : m));
          code = 'VALIDATION_ERROR';
          message = 'Bad request';
        } else if (typeof resMsg === 'string') {
          message = resMsg;
        }
      }
    } else {
      this.logger.error(
        `Unhandled exception: ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}