import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { AlumniProfileResponseDto } from '../dto/alumni-response.dto';
import { AlumniService } from '../services/alumni.service';

@ApiTags('Alumni')
@Controller('alumni')
export class AlumniController {
  constructor(private readonly alumniService: AlumniService) {}

  @Get()
  @ApiOperation({ summary: 'List approved alumni profiles' })
  async list(): Promise<ApiResponseDto<AlumniProfileResponseDto[]>> {
    const data = await this.alumniService.list();
    return ApiResponseDto.of(data);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alumni profile by id' })
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponseDto<AlumniProfileResponseDto>> {
    const data = await this.alumniService.getById(id);
    return ApiResponseDto.of(data);
  }
}
