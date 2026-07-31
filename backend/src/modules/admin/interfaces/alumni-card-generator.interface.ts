import { AlumniProfile } from '../../alumni/entities/alumni.entity';

export interface AlumniCardGenerationResult {
  qrCodeUrl: string;
  photoUrl: string | null;
  payload: Record<string, string>;
}

export interface IAlumniCardGenerator {
  generate(
    profile: AlumniProfile,
    options?: { photoUrl?: string },
  ): Promise<AlumniCardGenerationResult>;
}
