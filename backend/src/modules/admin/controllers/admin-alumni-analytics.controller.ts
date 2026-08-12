import {
  Controller,
  Get,
  Header,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { UserRole } from '../../../common/enums';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ApiWrappedOkResponse } from '../../../common/swagger/api-wrapped-response.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  AdminAlumniQueryDto,
  AdminOutreachExportQueryDto,
} from '../dto/admin-alumni.dto';
import { AdminAlumniListResponseDto } from '../dto/admin-response.dto';
import { AdminAlumniAnalyticsService } from '../services/admin-alumni-analytics.service';

@ApiTags('Admin / Alumni Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/alumni')
export class AdminAlumniAnalyticsController {
  constructor(
    private readonly adminAlumniAnalyticsService: AdminAlumniAnalyticsService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'List alumni with search/filters plus demographic and geographic analytics',
  })
  @ApiWrappedOkResponse(AdminAlumniListResponseDto)
  async list(@Query() query: AdminAlumniQueryDto) {
    const data = await this.adminAlumniAnalyticsService.list(query);
    return ApiResponseDto.of(data);
  }

  @Get('export/outreach')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary:
      'Export filtered alumni outreach CSV for WhatsApp/email campaigns',
  })
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportOutreach(
    @Query() query: AdminOutreachExportQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.adminAlumniAnalyticsService.exportOutreachCsv(query);
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="admin-alumni-outreach.csv"',
    );
    res.send(csv);
  }
}
