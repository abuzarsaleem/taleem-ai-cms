import { Injectable } from '@nestjs/common';
import {
  PhotoUploadStatus,
  VerificationTokenType,
} from '../../../common/enums';
import { generateId } from '../../../common/utils';
import {
  IPhotoUploadRepository,
  IVerificationTokenRepository,
  PhotoUpload,
  VerificationToken,
} from '../interfaces/supporting.repository.interface';

@Injectable()
export class InMemoryVerificationTokenRepository
  implements IVerificationTokenRepository
{
  private readonly store = new Map<string, VerificationToken>();

  async create(input: {
    userId: string;
    alumniId?: string | null;
    tokenHash: string;
    tokenType: VerificationTokenType;
    expiresAt: Date;
  }): Promise<VerificationToken> {
    const entity: VerificationToken = {
      id: generateId(),
      userId: input.userId,
      alumniId: input.alumniId ?? null,
      tokenHash: input.tokenHash,
      tokenType: input.tokenType,
      expiresAt: input.expiresAt,
      usedAt: null,
      createdAt: new Date(),
    };
    this.store.set(entity.id, entity);
    return { ...entity };
  }

  async findValidByHash(
    tokenHash: string,
    tokenType: VerificationTokenType,
  ): Promise<VerificationToken | null> {
    const now = Date.now();
    for (const entity of this.store.values()) {
      if (
        entity.tokenHash === tokenHash &&
        entity.tokenType === tokenType &&
        !entity.usedAt &&
        entity.expiresAt.getTime() > now
      ) {
        return { ...entity };
      }
    }
    return null;
  }

  async markUsed(id: string): Promise<void> {
    const existing = this.store.get(id);
    if (!existing) {
      return;
    }
    this.store.set(id, { ...existing, usedAt: new Date() });
  }

  async invalidateActiveForUser(
    userId: string,
    tokenType: VerificationTokenType,
  ): Promise<void> {
    for (const [id, entity] of this.store.entries()) {
      if (
        entity.userId === userId &&
        entity.tokenType === tokenType &&
        !entity.usedAt
      ) {
        this.store.set(id, { ...entity, usedAt: new Date() });
      }
    }
  }
}

@Injectable()
export class InMemoryPhotoUploadRepository implements IPhotoUploadRepository {
  private readonly store = new Map<string, PhotoUpload>();

  async create(input: {
    storageKey: string;
    publicUrl: string;
    uploadedByEmail?: string | null;
    expiresAt: Date;
  }): Promise<PhotoUpload> {
    const entity: PhotoUpload = {
      id: generateId(),
      storageKey: input.storageKey,
      publicUrl: input.publicUrl,
      status: PhotoUploadStatus.TEMP,
      uploadedByEmail: input.uploadedByEmail ?? null,
      expiresAt: input.expiresAt,
      createdAt: new Date(),
    };
    this.store.set(entity.id, entity);
    return { ...entity };
  }

  async findById(id: string): Promise<PhotoUpload | null> {
    const entity = this.store.get(id);
    return entity ? { ...entity } : null;
  }

  async markAttached(id: string): Promise<PhotoUpload> {
    const existing = this.store.get(id);
    if (!existing) {
      throw new Error(`Photo upload ${id} not found`);
    }
    const updated = { ...existing, status: PhotoUploadStatus.ATTACHED };
    this.store.set(id, updated);
    return { ...updated };
  }
}
