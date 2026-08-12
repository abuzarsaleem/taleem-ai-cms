import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Matches GlobalExceptionFilter JSON body for 4xx/5xx responses.
 */
export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    description: 'Error message or validation message list',
    oneOf: [
      { type: 'string', example: 'Invalid credentials' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['email must be an email'],
      },
    ],
  })
  message: string | string[];

  @ApiPropertyOptional({
    example: 'BUSINESS_ERROR',
    description: 'Application error code when thrown via BusinessException',
  })
  code?: string;

  @ApiPropertyOptional({
    example: 'Bad Request',
    description: 'Present for some Nest built-in HttpExceptions',
  })
  error?: string;

  @ApiProperty({ example: '/api/v1/admin/dashboard' })
  path: string;

  @ApiProperty({ example: '2026-08-11T14:30:00.000Z' })
  timestamp: string;
}

/**
 * Matches ApiResponseDto.of(...) success envelope used by controllers.
 */
export class ApiSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional({ example: 'Profile updated' })
  message?: string;

  @ApiProperty({
    description: 'Endpoint-specific payload returned by the handler',
  })
  data: unknown;
}
