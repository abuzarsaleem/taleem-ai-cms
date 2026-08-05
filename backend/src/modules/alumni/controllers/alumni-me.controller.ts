import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UpdateProfileDto } from '../dto/f001.dto';
import { ProfileService } from '../services/profile.service';

@ApiTags('Alumni Self-Service')
@Controller('me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ALUMNI)
@ApiBearerAuth()
export class AlumniMeController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get my alumni profile' })
  async getProfile(@CurrentUser() user: AuthUser) {
    const data = await this.profileService.getMyProfile(user.userId);
    return ApiResponseDto.of(data);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update my editable profile fields' })
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.profileService.updateMyProfile(user.userId, dto);
    return ApiResponseDto.of(data, 'Profile updated');
  }
}
