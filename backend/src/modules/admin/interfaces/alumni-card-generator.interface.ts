import { AlumniProfile } from '../../alumni/entities/alumni.entity';

export interface AlumniCardGenerationResult {
  /** Durable URL stored on alumni.qr_code */
  qrCodeUrl: string;
  /** Immediately usable (signed) URL for API responses */
  downloadUrl: string;
  photoUrl: string | null;
  payload: Record<string, string>;
}

export interface IAlumniCardGenerator {
  generate(
    profile: AlumniProfile,
    options?: { photoUrl?: string },
  ): Promise<AlumniCardGenerationResult>;
}
