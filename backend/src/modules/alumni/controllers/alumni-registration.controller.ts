import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { CreateRegistrationRequestDto } from '../dto/create-registration-request.dto';
import { RegistrationRequestResponseDto } from '../dto/registration-request-response.dto';
import { AlumniRegistrationService } from '../services/alumni-registration.service';

@ApiTags('Alumni Registration')
@Controller('alumni/registration')
export class AlumniRegistrationController {
  constructor(
    private readonly registrationService: AlumniRegistrationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit alumni registration request' })
  async submit(
    @Body() dto: CreateRegistrationRequestDto,
  ): Promise<ApiResponseDto<RegistrationRequestResponseDto>> {
    const data = await this.registrationService.submit(dto);
    return ApiResponseDto.of(data, 'Registration request submitted');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get registration request by id' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<RegistrationRequestResponseDto>> {
    const data = await this.registrationService.getById(id);
    return ApiResponseDto.of(data);
  }
}
