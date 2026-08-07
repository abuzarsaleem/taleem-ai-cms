import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { UpdateProfileDto } from '../dto/f001.dto';
import {
  CreateAcademicDto,
  CreateProfessionalDto,
  UpdateAcademicDto,
  UpdateProfessionalDto,
} from '../dto/me-career.dto';
import { MeCareerService } from '../services/me-career.service';
import { ProfileService } from '../services/profile.service';

@ApiTags('Alumni Self-Service')
@Controller('me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ALUMNI)
@ApiBearerAuth()
export class AlumniMeController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly meCareerService: MeCareerService,
  ) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get my alumni profile' })
  async getProfile(@CurrentUser() user: AuthUser) {
    const data = await this.profileService.getMyProfile(user.userId);
    return ApiResponseDto.of(data);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update my editable personal/contact profile fields' })
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.profileService.updateMyProfile(user.userId, dto);
    return ApiResponseDto.of(data, 'Profile updated');
  }

  @Get('professional')
  @ApiOperation({ summary: 'List my professional information records' })
  async listProfessional(@CurrentUser() user: AuthUser) {
    const data = await this.meCareerService.listProfessional(user.userId);
    return ApiResponseDto.of(data);
  }

  @Post('professional')
  @ApiOperation({
    summary:
      'Add a current job',
  })
  async createProfessional(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProfessionalDto,
  ) {
    const data = await this.meCareerService.createProfessional(
      user.userId,
      dto,
    );
    return ApiResponseDto.of(data, 'Professional information created');
  }

  @Put('professional/:id')
  @ApiOperation({ summary: 'Update one of my professional information records' })
  async updateProfessional(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfessionalDto,
  ) {
    const data = await this.meCareerService.updateProfessional(
      user.userId,
      id,
      dto,
    );
    return ApiResponseDto.of(data, 'Professional information updated');
  }

  @Delete('professional/:id')
  @ApiOperation({ summary: 'Delete one of my professional information records' })
  async deleteProfessional(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.meCareerService.deleteProfessional(user.userId, id);
    return ApiResponseDto.of(data, 'Professional information deleted');
  }

  @Get('academic')
  @ApiOperation({ summary: 'List my academic information records' })
  async listAcademic(@CurrentUser() user: AuthUser) {
    const data = await this.meCareerService.listAcademic(user.userId);
    return ApiResponseDto.of(data);
  }

  @Post('academic')
  @ApiOperation({ summary: 'Add an additional academic information record' })
  async createAcademic(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateAcademicDto,
  ) {
    const data = await this.meCareerService.createAcademic(user.userId, dto);
    return ApiResponseDto.of(data, 'Academic information created');
  }

  @Put('academic/:id')
  @ApiOperation({
    summary:
      'Update an academic information record',
  })
  async updateAcademic(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicDto,
  ) {
    const data = await this.meCareerService.updateAcademic(
      user.userId,
      id,
      dto,
    );
    return ApiResponseDto.of(data, 'Academic information updated');
  }

  @Delete('academic/:id')
  @ApiOperation({
    summary:
      'Delete an academic information record',
  })
  async deleteAcademic(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const data = await this.meCareerService.deleteAcademic(user.userId, id);
    return ApiResponseDto.of(data, 'Academic information deleted');
  }
}
