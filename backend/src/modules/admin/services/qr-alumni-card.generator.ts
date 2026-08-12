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
    _options?: { photoPublicUrl?: string | null },
  ): Promise<AlumniCardGenerationResult> {
    const verifyBase =
      process.env.ALUMNI_CARD_VERIFY_URL ??
      `${process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}`}/alumni/verify`;
    const qrContent = `${verifyBase}/${encodeURIComponent(profile.alumni.id)}`;

    // Sized for CR80 ID-card side placement (~22mm @ 150dpi)
    const pngBuffer = await QRCode.toBuffer(qrContent, {
      type: 'png',
      width: 128,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    const stored = await this.objectStorage.upload({
      buffer: pngBuffer,
      mimeType: 'image/png',
      folder: 'qr',
      fileName: `${profile.alumni.id}.png`,
    });

    this.logger.log(
      `QR generated alumniId=${profile.alumni.id} key=${stored.storageKey}`,
    );

    return {
      // Persist durable URL (short); signed download URLs exceed varchar and expire.
      qrCodeUrl: stored.publicUrl,
      downloadUrl: stored.downloadUrl,
      photoUrl: null,
      payload: {
        alumniId: profile.alumni.id,
        cnic: profile.alumni.cnicNationalId,
        fullName: profile.alumni.fullName,
        email: profile.alumni.email,
        qrContent,
      },
    };
  }
}
