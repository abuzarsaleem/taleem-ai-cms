import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationStatus } from '../../../common/enums';
import { AlumniRegistrationRequestEntity } from '../../../database/entities';
import { AlumniRegistrationRequest } from '../entities/alumni-registration-request.entity';
import {
  CreateRegistrationRequestInput,
  IRegistrationRequestRepository,
} from '../interfaces/registration-request.repository.interface';

@Injectable()
export class TypeOrmRegistrationRequestRepository
  implements IRegistrationRequestRepository
{
  constructor(
    @InjectRepository(AlumniRegistrationRequestEntity)
    private readonly repo: Repository<AlumniRegistrationRequestEntity>,
  ) {}

  async create(
    input: CreateRegistrationRequestInput,
  ): Promise<AlumniRegistrationRequest> {
    const entity = this.repo.create({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      phoneNumber: input.phoneNumber ?? null,
      status: RegistrationStatus.PENDING,
      whatsappNumber: input.whatsappNumber ?? null,
      cnicNationalId: input.cnicNationalId,
      degreeProgramId: input.degreeProgramId,
      registrationRollNumber: input.registrationRollNumber,
      graduationYear: input.graduationYear,
      photoUrl: input.photoUrl ?? null,
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
    });
    const saved = await this.repo.save(entity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<AlumniRegistrationRequest | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<AlumniRegistrationRequest | null> {
    const entity = await this.repo.findOne({
      where: { email: email.toLowerCase() },
      order: { createdAt: 'DESC' },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCnic(cnic: string): Promise<AlumniRegistrationRequest | null> {
    const entity = await this.repo.findOne({
      where: { cnicNationalId: cnic },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(
    status?: RegistrationStatus,
  ): Promise<AlumniRegistrationRequest[]> {
    const entities = await this.repo.find({
      where: status ? { status } : undefined,
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async update(
    id: string,
    patch: Partial<AlumniRegistrationRequest>,
  ): Promise<AlumniRegistrationRequest> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new Error(`Registration request ${id} not found`);
    Object.assign(existing, patch, { id: existing.id });
    const saved = await this.repo.save(existing);
    return this.toDomain(saved);
  }

  private toDomain(
    entity: AlumniRegistrationRequestEntity,
  ): AlumniRegistrationRequest {
    return {
      id: entity.id,
      fullName: entity.fullName,
      email: entity.email,
      phoneNumber: entity.phoneNumber,
      status: entity.status,
      whatsappNumber: entity.whatsappNumber,
      cnicNationalId: entity.cnicNationalId,
      degreeProgramId: entity.degreeProgramId,
      registrationRollNumber: entity.registrationRollNumber,
      graduationYear: entity.graduationYear,
      photoUrl: entity.photoUrl,
      reviewedBy: entity.reviewedBy,
      reviewedAt: entity.reviewedAt,
      rejectionReason: entity.rejectionReason,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
