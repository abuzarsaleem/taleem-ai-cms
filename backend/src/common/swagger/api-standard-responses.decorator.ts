import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../dto/api-error-response.dto';

/**
 * Shared error responses. Success schemas must be declared per-endpoint
 * via ApiWrappedOkResponse / ApiWrappedCreatedResponse / etc.
 */
export function ApiStandardResponses() {
  return applyDecorators(
    ApiBadRequestResponse({
      description:
        'Bad request — validation failure or business rule violation',
      type: ApiErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized — missing or invalid bearer token',
      type: ApiErrorResponseDto,
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal server error',
      type: ApiErrorResponseDto,
    }),
  );
}
