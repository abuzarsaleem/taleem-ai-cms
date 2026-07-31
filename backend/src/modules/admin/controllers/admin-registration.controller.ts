import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { AlumniProfileResponseDto } from '../../alumni/dto/alumni-response.dto';
import { RegistrationRequestResponseDto } from '../../alumni/dto/registration-request-response.dto';
import {
  ListRegistrationQueryDto,
  ReviewRegistrationDto,
} from '../dto/review-registration.dto';
import { AdminRegistrationService } from '../services/admin-registration.service';

@ApiTags('Admin Portal')
@Controller('admin/registration-requests')
export class AdminRegistrationController {
  constructor(
    private readonly adminRegistrationService: AdminRegistrationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List registration requests (admin portal)' })
  async list(
    @Query() query: ListRegistrationQueryDto,
  ): Promise<ApiResponseDto<RegistrationRequestResponseDto[]>> {
    const data = await this.adminRegistrationService.listRequests(query.status);
    return ApiResponseDto.of(data);
  }

  @Patch(':id/review')
  @ApiOperation({
    summary: 'Approve or reject a registration request',
    description:
      'On APPROVED, creates alumni + academic records and returns the new alumni profile.',
  })
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewRegistrationDto,
  ): Promise<
    ApiResponseDto<{
      request: RegistrationRequestResponseDto;
      alumni?: AlumniProfileResponseDto;
    }>
  > {
    const data = await this.adminRegistrationService.review(id, dto);
    return ApiResponseDto.of(
      data,
      data.request.status === 'APPROVED'
        ? 'Registration approved and alumni created'
        : 'Registration rejected',
    );
  }
}
