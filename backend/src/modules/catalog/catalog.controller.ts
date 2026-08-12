import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import { SWAGGER_TAGS } from '../../common/swagger/swagger-tags';
import { ApiWrappedOkResponse } from '../../common/swagger/api-wrapped-response.decorator';
import { SEED_CATALOG } from '../../database/seeds/catalog.seed';
import {
  CampusResponseDto,
  DegreeProgramResponseDto,
  DegreeResponseDto,
  ProgramResponseDto,
} from './dto/catalog-response.dto';

@ApiTags(SWAGGER_TAGS.CATALOG)
@Controller('catalog')
export class CatalogController {
  @Get('campuses')
  @ApiOperation({ summary: 'List campuses' })
  @ApiWrappedOkResponse(CampusResponseDto, { isArray: true })
  listCampuses() {
    return ApiResponseDto.of(SEED_CATALOG.campuses);
  }

  @Get('degrees')
  @ApiOperation({ summary: 'List degree levels' })
  @ApiWrappedOkResponse(DegreeResponseDto, { isArray: true })
  listDegrees() {
    return ApiResponseDto.of(SEED_CATALOG.degrees);
  }

  @Get('programs')
  @ApiOperation({ summary: 'List programs' })
  @ApiWrappedOkResponse(ProgramResponseDto, { isArray: true })
  listPrograms() {
    return ApiResponseDto.of(SEED_CATALOG.programs);
  }

  @Get('degree-programs')
  @ApiOperation({ summary: 'List degree program offerings' })
  @ApiQuery({ name: 'campus_id', required: false })
  @ApiWrappedOkResponse(DegreeProgramResponseDto, { isArray: true })
  listDegreePrograms(@Query('campus_id') campusId?: string) {
    const items = campusId
      ? SEED_CATALOG.degree_programs.filter((dp) => dp.campus_id === campusId)
      : SEED_CATALOG.degree_programs;
    return ApiResponseDto.of(items);
  }
}
