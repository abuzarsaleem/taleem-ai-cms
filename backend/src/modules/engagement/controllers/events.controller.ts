import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { UserRole } from '../../../common/enums';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  EventListQueryDto,
  RsvpEventDto,
} from '../dto/event.dto';
import { EventService } from '../services/event.service';

@ApiTags('Events & RSVP')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @Roles(UserRole.ALUMNI, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List events (paginated; scope=upcoming|past|all; includes RSVP counts)',
  })
  async list(@CurrentUser() user: AuthUser, @Query() query: EventListQueryDto) {
    const data = await this.eventService.list(user, query);
    return ApiResponseDto.of(data);
  }

  @Post(':id/rsvp')
  @Roles(UserRole.ALUMNI)
  @ApiOperation({ summary: 'Upsert RSVP for an event' })
  async rsvp(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RsvpEventDto,
  ) {
    const data = await this.eventService.upsertRsvp(user.userId, id, dto);
    return ApiResponseDto.of(data, 'RSVP saved');
  }

  @Get(':id')
  @Roles(UserRole.ALUMNI, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get event by id (RSVP counts + my status)' })
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.eventService.getById(id, user);
    return ApiResponseDto.of(data);
  }
}
