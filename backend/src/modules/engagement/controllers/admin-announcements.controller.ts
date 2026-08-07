import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { UserRole } from '../../../common/enums';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  AnnouncementListQueryDto,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
} from '../dto/announcement.dto';
import { AnnouncementService } from '../services/announcement.service';

@ApiTags('Announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/announcements')
export class AdminAnnouncementsController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get()
  @ApiOperation({ summary: 'Admin announcements feed' })
  async list(
    @CurrentUser() user: AuthUser,
    @Query() query: AnnouncementListQueryDto,
  ) {
    const data = await this.announcementService.list(user.role, query);
    return ApiResponseDto.of(data);
  }

  @Post('upload-image')
  @ApiOperation({
    summary: 'Upload announcement image',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile()
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
  ) {
    const data = await this.announcementService.uploadImage(file);
    return ApiResponseDto.of(data, 'Image uploaded');
  }

  @Post()
  @ApiOperation({
    summary:
      'Create announcement or alumni spotlight',
  })
  async create(
    @CurrentUser() admin: AuthUser,
    @Body() dto: CreateAnnouncementDto,
  ) {
    const data = await this.announcementService.create(admin.userId, dto);
    return ApiResponseDto.of(data, 'Announcement created');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin get announcement by id' })
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.announcementService.getById(id, user.role);
    return ApiResponseDto.of(data);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update announcement',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAnnouncementDto,
  ) {
    const data = await this.announcementService.update(id, dto);
    return ApiResponseDto.of(data, 'Announcement updated');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete announcement' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.announcementService.remove(id);
    return ApiResponseDto.of(data, 'Announcement deleted');
  }
}
