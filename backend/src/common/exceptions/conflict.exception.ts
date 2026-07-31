import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

export class ConflictException extends BusinessException {
  constructor(message: string) {
    super(message, HttpStatus.CONFLICT, 'CONFLICT');
  }
}
