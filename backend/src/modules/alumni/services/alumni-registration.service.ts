import { Injectable, Inject } from '@nestjs/common';
import { REGISTRATION_REQUEST_REPOSITORY } from '../../../common/constants/tokens';
import {
  ConflictException,
  ResourceNotFoundException,
} from '../../../common/exceptions';
import { RegistrationStatus } from '../../../common/enums';
import { CreateRegistrationRequestDto } from '../dto/create-registration-request.dto';
import { RegistrationRequestResponseDto } from '../dto/registration-request-response.dto';
import { AlumniRegistrationRequest } from '../entities/alumni-registration-request.entity';
import type { IRegistrationRequestRepository } from '../interfaces/registration-request.repository.interface';

@Injectable()
export class AlumniRegistrationService {
  constructor(
    @Inject(REGISTRATION_REQUEST_REPOSITORY)
    private readonly registrationRepository: IRegistrationRequestRepository,
  ) {}

  async submit(
    dto: CreateRegistrationRequestDto,
  ): Promise<RegistrationRequestResponseDto> {
    const existing = await this.registrationRepository.findByEmail(dto.email);
    if (existing && existing.status !== RegistrationStatus.REJECTED) {
      throw new ConflictException(
        'A registration request already exists for this email',
      );
    }

    const created = await this.registrationRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      campus: dto.campus,
      degree: dto.degree,
      rollNumber: dto.rollNumber,
      graduationYear: dto.graduationYear,
      cgpa: dto.cgpa,
    });

    return this.toResponse(created);
  }

  async getById(id: string): Promise<RegistrationRequestResponseDto> {
    const request = await this.registrationRepository.findById(id);
    if (!request) {
      throw new ResourceNotFoundException('Registration request', id);
    }
    return this.toResponse(request);
  }

  async list(
    status?: RegistrationStatus,
  ): Promise<RegistrationRequestResponseDto[]> {
    const items = await this.registrationRepository.findAll(status);
    return items.map((item) => this.toResponse(item));
  }

  private toResponse(
    entity: AlumniRegistrationRequest,
  ): RegistrationRequestResponseDto {
    return {
      id: entity.id,
      fullName: entity.fullName,
      email: entity.email,
      phoneNumber: entity.phoneNumber,
      status: entity.status,
      submittedAt: entity.submittedAt,
      reviewedBy: entity.reviewedBy,
      reviewedAt: entity.reviewedAt,
      rejectionReason: entity.rejectionReason,
      campus: entity.campus,
      degree: entity.degree,
      rollNumber: entity.rollNumber,
      graduationYear: entity.graduationYear,
      cgpa: entity.cgpa,
    };
  }
}
