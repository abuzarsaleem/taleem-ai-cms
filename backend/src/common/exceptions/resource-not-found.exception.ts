import { HttpStatus } from '@nestjs/common';
import { BusinessException } from './business.exception';

export class ResourceNotFoundException extends BusinessException {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with id '${identifier}' was not found`
      : `${resource} was not found`;
    super(message, HttpStatus.NOT_FOUND, 'RESOURCE_NOT_FOUND');
  }
}
