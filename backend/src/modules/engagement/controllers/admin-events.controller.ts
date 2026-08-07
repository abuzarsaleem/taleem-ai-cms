import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { UserRole } from '../../../common/enums';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  CreateEventDto,
  EventListQueryDto,
  UpdateEventDto,
} from '../dto/event.dto';
import { EventService } from '../services/event.service';

@ApiTags('Events & RSVP')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/events')
export class AdminEventsController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @ApiOperation({ summary: 'Admin list events' })
  async list(@CurrentUser() user: AuthUser, @Query() query: EventListQueryDto) {
    const data = await this.eventService.list(user, query);
    return ApiResponseDto.of(data);
  }

  @Post()
  @ApiOperation({ summary: 'Create and publish an event' })
  async create(@CurrentUser() admin: AuthUser, @Body() dto: CreateEventDto) {
    const data = await this.eventService.create(admin.userId, dto);
    return ApiResponseDto.of(data, 'Event published');
  }

  @Get(':id/manifest/export')
  @ApiOperation({ summary: 'Export attendance manifest CSV' })
  @ApiProduces('text/csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportManifest(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const csv = await this.eventService.buildManifestCsv(id);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="event-${id}-manifest.csv"`,
    );
    res.send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin get event by id' })
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.eventService.getById(id, user);
    return ApiResponseDto.of(data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
  ) {
    const data = await this.eventService.update(id, dto);
    return ApiResponseDto.of(data, 'Event updated');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.eventService.remove(id);
    return ApiResponseDto.of(data, 'Event deleted');
  }
}
