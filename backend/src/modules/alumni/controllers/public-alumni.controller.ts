import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AlumniVerifyResponseDto } from '../dto/alumni-verify.dto';
import { AlumniVerifyService } from '../services/alumni-verify.service';

@ApiTags('Public Alumni')
@Controller('public/alumni')
export class PublicAlumniController {
  constructor(private readonly alumniVerifyService: AlumniVerifyService) {}

  @Get(':alumniId/verify')
  @ApiOperation({
    summary: 'Verify alumni card (public, no auth)',
    description:
      'Used by gatekeepers when scanning an alumni QR code. Accepts alumni UUID or public alumni code (ALM-YYYY-#######). Returns safe card fields for active alumni only.',
  })
  @ApiOkResponse({ type: AlumniVerifyResponseDto })
  async verify(
    @Param('alumniId') alumniId: string,
  ): Promise<AlumniVerifyResponseDto> {
    return this.alumniVerifyService.verify(alumniId);
  }
}
