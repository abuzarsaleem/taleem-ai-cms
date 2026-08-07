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
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import { RegistrationStatus, UserRole } from '../../../common/enums';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { AuthService } from '../../auth/auth.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  AdminLoginDto,
  ReviewRegistrationDto,
} from '../dto/admin.dto';
import { ApprovalService } from '../services/approval.service';
import { RegistrationReviewService } from '../services/registration-review.service';
import { RejectionService } from '../services/rejection.service';

@ApiTags('Admin Portal')
@Controller('admin')
export class AdminPortalController {
  constructor(
    private readonly authService: AuthService,
    private readonly reviewService: RegistrationReviewService,
    private readonly approvalService: ApprovalService,
    private readonly rejectionService: RejectionService,
  ) {}

  @Post('auth/login')
  @ApiOperation({ summary: 'Admin login' })
  async login(@Body() dto: AdminLoginDto) {
    const data = await this.authService.login(dto.email, dto.password, [
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ]);
    return ApiResponseDto.of(
      {
        access_token: data.accessToken,
        role: data.role,
        user_id: data.userId,
      },
      'Admin login successful',
    );
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin dashboard counts' })
  async dashboard() {
    const data = await this.reviewService.dashboard();
    return ApiResponseDto.of(data);
  }

  @Get('registrations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiQuery({ name: 'status', required: false, enum: RegistrationStatus })
  @ApiOperation({ summary: 'List registration requests' })
  async list(@Query('status') status?: RegistrationStatus) {
    const data = await this.reviewService.list(status);
    return ApiResponseDto.of(data);
  }

  @Get('registrations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Registration detail' })
  async detail(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.reviewService.detail(id);
    return ApiResponseDto.of(data);
  }

  @Patch('registrations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve or reject registration via status body',
  })
  async review(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: AuthUser,
    @Body() dto: ReviewRegistrationDto,
  ) {
    if (dto.status === RegistrationStatus.APPROVED) {
      const data = await this.approvalService.approve(id, admin.userId);
      return ApiResponseDto.of(data, 'Registration approved');
    }

    const data = await this.rejectionService.reject(
      id,
      admin.userId,
      dto.rejection_reason ?? '',
    );
    return ApiResponseDto.of(data, 'Registration rejected');
  }

  @Post('registrations/:id/resend-activation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Resend approval activation notification' })
  async resend(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.reviewService.resendNotification(id);
    return ApiResponseDto.of(data, 'Activation notification resent');
  }
}
