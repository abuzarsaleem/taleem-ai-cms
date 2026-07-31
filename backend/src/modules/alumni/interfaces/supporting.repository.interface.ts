import {
  PhotoUploadStatus,
  VerificationTokenType,
} from '../../../common/enums';

export class VerificationToken {
  id: string;
  userId: string;
  alumniId: string | null;
  tokenHash: string;
  tokenType: VerificationTokenType;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface IVerificationTokenRepository {
  create(input: {
    userId: string;
    alumniId?: string | null;
    tokenHash: string;
    tokenType: VerificationTokenType;
    expiresAt: Date;
  }): Promise<VerificationToken>;
  findValidByHash(
    tokenHash: string,
    tokenType: VerificationTokenType,
  ): Promise<VerificationToken | null>;
  markUsed(id: string): Promise<void>;
  invalidateActiveForUser(
    userId: string,
    tokenType: VerificationTokenType,
  ): Promise<void>;
}

export class PhotoUpload {
  id: string;
  storageKey: string;
  publicUrl: string;
  status: PhotoUploadStatus;
  uploadedByEmail: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface IPhotoUploadRepository {
  create(input: {
    storageKey: string;
    publicUrl: string;
    uploadedByEmail?: string | null;
    expiresAt: Date;
  }): Promise<PhotoUpload>;
  findById(id: string): Promise<PhotoUpload | null>;
  markAttached(id: string): Promise<PhotoUpload>;
}
