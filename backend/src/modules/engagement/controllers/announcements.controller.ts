import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { SWAGGER_TAGS } from '../../../common/swagger/swagger-tags';
import { UserRole } from '../../../common/enums';
import { RolesGuard } from '../../../common/guards/roles.guard';
import {
  ApiWrappedOkResponse,
  ApiWrappedPaginatedResponse,
} from '../../../common/swagger/api-wrapped-response.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AnnouncementListQueryDto } from '../dto/announcement.dto';
import { AnnouncementResponseDto } from '../dto/announcement-response.dto';
import { AnnouncementService } from '../services/announcement.service';

@ApiTags(SWAGGER_TAGS.ANNOUNCEMENTS)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get()
  @Roles(UserRole.ALUMNI, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Published announcements feed' })
  @ApiWrappedPaginatedResponse(AnnouncementResponseDto)
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: AnnouncementListQueryDto,
  ) {
    const data = await this.announcementService.list(user.role, query);
    return ApiResponseDto.of(data);
  }

  @Get(':id')
  @Roles(UserRole.ALUMNI, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get announcement by id' })
  @ApiWrappedOkResponse(AnnouncementResponseDto)
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.announcementService.getById(id, user.role);
    return ApiResponseDto.of(data);
  }
}
