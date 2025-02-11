import { ArgumentsHost, Catch, ExceptionFilter, Logger } from "@nestjs/common";
import { ZodError } from "zod";

@Catch(ZodError)
export class ZodFilter<T extends ZodError> implements ExceptionFilter {
  private readonly logger = new Logger(ZodFilter.name);

  catch(exception: T, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = 400;

    response.status(status).json({
      statusCode: status,
      message: 'Validation failed',
      errors: exception.errors,
    });
  }
}
