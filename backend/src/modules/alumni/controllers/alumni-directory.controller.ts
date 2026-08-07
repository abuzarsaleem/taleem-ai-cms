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
  CreateContactRequestDto,
  DirectoryQueryDto,
} from '../dto/contact-request.dto';
import { AlumniDirectoryService } from '../services/alumni-directory.service';
import { ContactRequestService } from '../services/contact-request.service';

@ApiTags('Alumni Directory & Contact Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ALUMNI)
@Controller()
export class AlumniDirectoryController {
  constructor(
    private readonly directoryService: AlumniDirectoryService,
    private readonly contactRequestService: ContactRequestService,
  ) {}

  @Get('directory')
  @ApiOperation({ summary: 'Paginated alumni directory with masked contacts' })
  async listDirectory(
    @CurrentUser() user: AuthUser,
    @Query() query: DirectoryQueryDto,
  ) {
    const data = await this.directoryService.list(user.userId, query);
    return ApiResponseDto.of(data);
  }

  @Get('directory/:alumniId')
  @ApiOperation({ summary: 'Alumni directory profile' })
  async getDirectoryProfile(
    @CurrentUser() user: AuthUser,
    @Param('alumniId', ParseUUIDPipe) alumniId: string,
  ) {
    const data = await this.directoryService.getOne(user.userId, alumniId);
    return ApiResponseDto.of(data);
  }

  @Post('contact-requests')
  @ApiOperation({ summary: 'Submit contact request' })
  async createContactRequest(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateContactRequestDto,
  ) {
    const data = await this.contactRequestService.create(
      user.userId,
      dto.target_alumni_id,
      dto.request_reason,
    );
    return ApiResponseDto.of(data, 'Contact request submitted');
  }

  @Get('contact-requests/sent')
  @ApiOperation({ summary: 'Contact requests sent by current alumnus' })
  async listSent(@CurrentUser() user: AuthUser) {
    const data = await this.contactRequestService.listSent(user.userId);
    return ApiResponseDto.of(data);
  }
}
