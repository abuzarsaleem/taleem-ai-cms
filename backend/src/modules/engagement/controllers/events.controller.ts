import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
import {
  ApiWrappedCreatedResponse,
  ApiWrappedOkResponse,
  ApiWrappedPaginatedResponse,
} from '../../../common/swagger/api-wrapped-response.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  EventListQueryDto,
  RsvpEventDto,
} from '../dto/event.dto';
import {
  EventDetailResponseDto,
  RsvpResponseDto,
} from '../dto/event-response.dto';
import { EventService } from '../services/event.service';

@ApiTags('Alumni / Events & RSVP')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  @Roles(UserRole.ALUMNI, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'List events',
  })
  @ApiWrappedPaginatedResponse(EventDetailResponseDto)
  async list(@CurrentUser() user: AuthUser, @Query() query: EventListQueryDto) {
    const data = await this.eventService.list(user, query);
    return ApiResponseDto.of(data);
  }

  @Post(':id/rsvp')
  @Roles(UserRole.ALUMNI)
  @ApiOperation({
    summary: 'Create my RSVP for an event (fails if already exists)',
  })
  @ApiWrappedCreatedResponse(RsvpResponseDto)
  async createRsvp(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RsvpEventDto,
  ) {
    const data = await this.eventService.createRsvp(user.userId, id, dto);
    return ApiResponseDto.of(data, 'RSVP created');
  }

  @Patch(':id/rsvp')
  @Roles(UserRole.ALUMNI)
  @ApiOperation({
    summary:
      'Update my RSVP status when changing mind (GOING | NOT_GOING | MAYBE)',
  })
  @ApiWrappedOkResponse(RsvpResponseDto)
  async updateRsvp(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RsvpEventDto,
  ) {
    const data = await this.eventService.updateMyRsvp(user.userId, id, dto);
    return ApiResponseDto.of(data, 'RSVP status updated');
  }

  @Get(':id')
  @Roles(UserRole.ALUMNI, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get event by id' })
  @ApiWrappedOkResponse(EventDetailResponseDto)
  async getOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.eventService.getById(id, user);
    return ApiResponseDto.of(data);
  }
}
