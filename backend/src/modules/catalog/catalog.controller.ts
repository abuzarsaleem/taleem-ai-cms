import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { SEED_CATALOG } from '../../database/seeds/catalog.seed';

@ApiTags('Catalog')
@Controller('catalog')
export class CatalogController {
  @Get('campuses')
  @ApiOperation({ summary: 'List campuses' })
  listCampuses() {
    return ApiResponseDto.of(SEED_CATALOG.campuses);
  }

  @Get('degrees')
  @ApiOperation({ summary: 'List degree levels' })
  listDegrees() {
    return ApiResponseDto.of(SEED_CATALOG.degrees);
  }

  @Get('programs')
  @ApiOperation({ summary: 'List programs' })
  listPrograms() {
    return ApiResponseDto.of(SEED_CATALOG.programs);
  }

  @Get('degree-programs')
  @ApiOperation({ summary: 'List degree+program(+campus) offerings' })
  @ApiQuery({ name: 'campus_id', required: false })
  listDegreePrograms(@Query('campus_id') campusId?: string) {
    const items = campusId
      ? SEED_CATALOG.degree_programs.filter((dp) => dp.campus_id === campusId)
      : SEED_CATALOG.degree_programs;
    return ApiResponseDto.of(items);
  }
}
