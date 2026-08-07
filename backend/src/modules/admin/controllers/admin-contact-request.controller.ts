import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { UserRole } from '../../../common/enums';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ContactRequestService } from '../../alumni/services/contact-request.service';
import {
  AdminContactRequestQueryDto,
  AdminContactReviewAction,
  AdminReviewContactRequestDto,
} from '../../alumni/dto/contact-request.dto';

@ApiTags('Admin Contact Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin/contact-requests')
export class AdminContactRequestController {
  constructor(private readonly contactRequestService: ContactRequestService) {}

  @Get()
  @ApiOperation({ summary: 'List alumni contact requests' })
  async list(@Query() query: AdminContactRequestQueryDto) {
    const data = await this.contactRequestService.listForAdmin(query.status);
    return ApiResponseDto.of(data);
  }

  @Patch(':id/:action')
  @ApiOperation({ summary: 'Admin approve or reject contact request' })
  @ApiParam({ name: 'action', enum: AdminContactReviewAction })
  async review(
    @CurrentUser() admin: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('action', new ParseEnumPipe(AdminContactReviewAction))
    action: AdminContactReviewAction,
    @Body() dto: AdminReviewContactRequestDto = {},
  ) {
    const data = await this.contactRequestService.reviewAsAdmin(
      admin.userId,
      id,
      action,
      dto.rejection_reason,
    );
    return ApiResponseDto.of(data, 'Contact request reviewed');
  }
}
