import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ZodError } from 'zod';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        message = (res as any).message || exception.message;
        errors = (res as any).errors || null;
      } else {
        message = res as string;
      }
    } else if (exception instanceof ZodError) {
      status = HttpStatus.BAD_REQUEST;
      const issues = exception.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      message = issues || 'Données fournies invalides';
      errors = exception.flatten();
    } else if (exception && typeof exception === 'object' && 'code' in exception) {
      const dbErr = exception as any;
      if (dbErr.code === '23505') {
        // Unique constraint violation in Postgres
        status = HttpStatus.CONFLICT;
        message = 'Un enregistrement avec cette clé ou ce code existe déjà.';
      } else if (dbErr.code === '23503') {
        // Foreign key violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Référence invalide à une ressource dépendante inexistante.';
      } else {
        message = dbErr.message || 'Erreur d’accès à la base de données';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Status ${status} - Error: ${message}`,
      exception instanceof Error ? exception.stack : undefined
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(errors ? { errors } : {}),
    });
  }
}
