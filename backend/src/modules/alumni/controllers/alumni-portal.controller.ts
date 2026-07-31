import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
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
import { ApiResponseDto } from '../../../common/dto/api-response.dto';
import type { AuthUser } from '../../../common/decorators/current-user.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '../../../common/enums';
import { AuthService } from '../../auth/auth.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import {
  ActivateDto,
  LoginDto,
  RegisterDto,
  ResendActivationDto,
  UpdateProfileDto,
} from '../dto/f001.dto';
import { ActivationService } from '../services/activation.service';
import { PhotoUploadService } from '../services/photo-upload.service';
import { ProfileService } from '../services/profile.service';
import { RegistrationService } from '../services/registration.service';

@ApiTags('Alumni Portal')
@Controller()
export class AlumniPortalController {
  constructor(
    private readonly photoUploadService: PhotoUploadService,
    private readonly registrationService: RegistrationService,
    private readonly activationService: ActivationService,
    private readonly profileService: ProfileService,
    private readonly authService: AuthService,
  ) {}

  @Post('upload-photo')
  @ApiOperation({ summary: 'Upload temporary alumni photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @UploadedFile()
    file: {
      buffer: Buffer;
      mimetype: string;
      originalname: string;
      size: number;
    },
  ) {
    const data = await this.photoUploadService.uploadTemp(file);
    return ApiResponseDto.of(data, 'Photo uploaded');
  }

  @Post('register')
  @ApiOperation({ summary: 'Submit alumni registration' })
  async register(@Body() dto: RegisterDto) {
    const data = await this.registrationService.register(dto);
    return ApiResponseDto.of(data, 'Registration submitted');
  }

  @Post('resend-activation')
  @ApiOperation({ summary: 'Resend activation link' })
  async resendActivation(@Body() dto: ResendActivationDto) {
    const data = await this.activationService.resendActivation(dto.email);
    return ApiResponseDto.of(data, 'Activation email resent');
  }

  @Post('activate')
  @ApiOperation({ summary: 'Activate account with token and password' })
  async activate(@Body() dto: ActivateDto) {
    const data = await this.activationService.activate(dto.token, dto.password);
    return ApiResponseDto.of(data, 'Account activated');
  }

  @Post('auth/login')
  @ApiOperation({ summary: 'Alumni login' })
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto.email, dto.password, [
      UserRole.ALUMNI,
    ]);
    return ApiResponseDto.of(
      {
        access_token: data.accessToken,
        role: data.role,
        user_id: data.userId,
      },
      'Login successful',
    );
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my alumni profile' })
  async getProfile(@CurrentUser() user: AuthUser) {
    const data = await this.profileService.getMyProfile(user.userId);
    return ApiResponseDto.of(data);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update my editable profile fields' })
  async updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProfileDto,
  ) {
    const data = await this.profileService.updateMyProfile(user.userId, dto);
    return ApiResponseDto.of(data, 'Profile updated');
  }
}
