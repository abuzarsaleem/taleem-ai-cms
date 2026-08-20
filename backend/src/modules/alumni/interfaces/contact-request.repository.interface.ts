import { ContactRequestStatus } from '../../../common/enums';

export class AlumniContactRequest {
  id: string;
  requesterAlumniId: string;
  targetAlumniId: string;
  requestReason: string;
  requestedFields: string[];
  status: ContactRequestStatus;
  adminId: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactRequestInput {
  requesterAlumniId: string;
  targetAlumniId: string;
  requestReason: string;
  requestedFields: string[];
}

export interface IContactRequestRepository {
  create(input: CreateContactRequestInput): Promise<AlumniContactRequest>;
  findById(id: string): Promise<AlumniContactRequest | null>;
  findSentByRequester(requesterAlumniId: string): Promise<AlumniContactRequest[]>;
  findReceivedByTarget(
    targetAlumniId: string,
    status?: ContactRequestStatus,
  ): Promise<AlumniContactRequest[]>;
  findAll(status?: ContactRequestStatus): Promise<AlumniContactRequest[]>;
  findApprovedPair(
    requesterAlumniId: string,
    targetAlumniId: string,
  ): Promise<AlumniContactRequest | null>;
  findActivePair(
    requesterAlumniId: string,
    targetAlumniId: string,
  ): Promise<AlumniContactRequest | null>;
  update(
    id: string,
    patch: Partial<AlumniContactRequest>,
  ): Promise<AlumniContactRequest>;
}
