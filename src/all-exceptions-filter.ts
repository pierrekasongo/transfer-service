import {
  Catch,
  ArgumentsHost,
  HttpServer,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { BaseExceptionFilter } from '@nestjs/core';
import { Request, Response } from 'express';
import { MyLoggerService } from './my-logger/my-logger.service';
import { PrismaClientValidationError } from '@prisma/client/runtime/library';

type ExceptionResponse = {
  statusCode: number;
  timestamp: string;
  path: string;
  response: string | object;
};

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new MyLoggerService(AllExceptionsFilter.name);
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;

    const exceptionResponse: ExceptionResponse = {
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: request.url,
      response: '',
    };
    if (exception instanceof HttpException) {
      exceptionResponse.response = exception.getResponse();
      exceptionResponse.statusCode = exception.getStatus();
    } else if (exception instanceof PrismaClientValidationError) {
      exceptionResponse.response = exception.message.replaceAll(/\n/g, '');
      exceptionResponse.statusCode = 422;
    } else {
      exceptionResponse.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      exceptionResponse.response = 'Internal Server Error';
    }
    response.status(exceptionResponse.statusCode).json(exceptionResponse);
    this.logger.error(exceptionResponse.response, AllExceptionsFilter.name);
    super.catch(exception, host);
  }
}
