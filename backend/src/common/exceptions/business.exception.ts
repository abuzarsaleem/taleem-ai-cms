import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly code = 'BUSINESS_ERROR',
  ) {
    super({ statusCode: status, message, code }, status);
  }
}
