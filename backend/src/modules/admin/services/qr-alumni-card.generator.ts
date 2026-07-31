import { Inject, Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PHOTO_STORAGE } from '../../../common/constants/tokens';
import type { IObjectStorage } from '../../../common/interfaces/photo-storage.interface';
import { AlumniProfile } from '../../alumni/entities/alumni.entity';
import {
  AlumniCardGenerationResult,
  IAlumniCardGenerator,
} from '../interfaces/alumni-card-generator.interface';

@Injectable()
export class QrAlumniCardGenerator implements IAlumniCardGenerator {
  private readonly logger = new Logger(QrAlumniCardGenerator.name);

  constructor(
    @Inject(PHOTO_STORAGE) private readonly objectStorage: IObjectStorage,
  ) {}

  async generate(
    profile: AlumniProfile,
    options?: { photoUrl?: string },
  ): Promise<AlumniCardGenerationResult> {
    const photoUrl =
      options?.photoUrl ??
      profile.alumni.alumniPhoto ??
      profile.personal?.photoUrl ??
      null;

    const payload = {
      type: 'alumni_digital_card',
      alumniId: profile.alumni.id,
      registrationRef: profile.alumni.registrationRef,
      fullName: profile.alumni.fullName,
      email: profile.alumni.email,
      campus: profile.academic.campus,
      degree: profile.academic.degree,
      graduationYear: String(profile.academic.graduationYear),
    };

    const verifyBase =
      process.env.ALUMNI_CARD_VERIFY_URL ??
      `${process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`}/alumni/verify`;
    const qrContent = `${verifyBase}/${encodeURIComponent(profile.alumni.registrationRef)}`;

    const pngBuffer = await QRCode.toBuffer(qrContent, {
      type: 'png',
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
    });

    const stored = await this.objectStorage.upload({
      buffer: pngBuffer,
      mimeType: 'image/png',
      folder: 'qr',
      fileName: `${profile.alumni.registrationRef}.png`,
    });

    this.logger.log(
      `QR generated alumniId=${profile.alumni.id} key=${stored.storageKey}`,
    );

    return {
      qrCodeUrl: stored.publicUrl,
      photoUrl,
      payload: {
        ...payload,
        qrContent,
      },
    };
  }
}
