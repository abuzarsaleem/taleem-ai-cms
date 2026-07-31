import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiPropertyOptional()
  message?: string;

  data: T;

  constructor(data: T, message?: string) {
    this.success = true;
    this.data = data;
    this.message = message;
  }

  static of<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto(data, message);
  }
}
