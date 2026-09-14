import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const rawMsg =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).message || exceptionResponse
        : exceptionResponse;

    const msg = Array.isArray(rawMsg) ? rawMsg.join(', ') : rawMsg;

    this.logger.error(
      `HTTP ${status} [${request.method}] ${request.url}: ${msg}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      success: false,
      msg,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
