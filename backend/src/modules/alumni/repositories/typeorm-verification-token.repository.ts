import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { VerificationTokenType } from '../../../common/enums';
import {
  AlumniEntity,
  AlumniVerificationEntity,
} from '../../../database/entities';
import {
  IVerificationTokenRepository,
  VerificationToken,
} from '../interfaces/supporting.repository.interface';

/**
 * Maps activation tokens onto alumni_verification (1 row per alumni).
 * tokenType is not stored in schema — activation is the only persisted type.
 */
@Injectable()
export class TypeOrmVerificationTokenRepository
  implements IVerificationTokenRepository
{
  constructor(
    @InjectRepository(AlumniVerificationEntity)
    private readonly tokens: Repository<AlumniVerificationEntity>,
    @InjectRepository(AlumniEntity)
    private readonly alumni: Repository<AlumniEntity>,
  ) {}

  async create(input: {
    userId: string;
    alumniId?: string | null;
    tokenHash: string;
    tokenType: VerificationTokenType;
    expiresAt: Date;
  }): Promise<VerificationToken> {
    if (!input.alumniId) {
      throw new Error('alumniId is required to persist verification tokens');
    }

    await this.tokens.delete({ alumniId: input.alumniId });

    const saved = await this.tokens.save(
      this.tokens.create({
        alumniId: input.alumniId,
        tokenHash: input.tokenHash,
        expiresAt: input.expiresAt,
        usedAt: null,
      }),
    );

    return this.toDomain(saved, input.userId, input.tokenType);
  }

  async findValidByHash(
    tokenHash: string,
    tokenType: VerificationTokenType,
  ): Promise<VerificationToken | null> {
    if (tokenType !== VerificationTokenType.ACTIVATION) {
      return null;
    }

    const entity = await this.tokens.findOne({
      where: {
        tokenHash,
        usedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      relations: { alumni: true },
    });
    if (!entity) return null;

    return this.toDomain(
      entity,
      entity.alumni?.userId ?? '',
      VerificationTokenType.ACTIVATION,
    );
  }

  async markUsed(id: string): Promise<void> {
    await this.tokens.update({ id }, { usedAt: new Date() });
  }

  async invalidateActiveForUser(
    userId: string,
    _tokenType: VerificationTokenType,
  ): Promise<void> {
    const profile = await this.alumni.findOne({ where: { userId } });
    if (!profile) return;
    await this.tokens.update(
      { alumniId: profile.id, usedAt: IsNull() },
      { usedAt: new Date() },
    );
  }

  private toDomain(
    entity: AlumniVerificationEntity,
    userId: string,
    tokenType: VerificationTokenType,
  ): VerificationToken {
    return {
      id: entity.id,
      userId,
      alumniId: entity.alumniId,
      tokenHash: entity.tokenHash,
      tokenType,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
    };
  }
}
