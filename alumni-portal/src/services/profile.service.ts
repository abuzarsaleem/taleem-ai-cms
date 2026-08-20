import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"
import type {
  AlumniProfile,
  CreateAcademicPayload,
  CreateProfessionalPayload,
  ProfileAcademic,
  ProfileProfessional,
  UpdateAcademicPayload,
  UpdateProfessionalPayload,
  UpdateProfilePayload,
} from "@/types/portal"

export const profileService = {
  async getMyProfile(): Promise<AlumniProfile> {
    const { data } = await apiClient.get<ApiResponse<AlumniProfile>>(
      "/me/profile",
    )
    return data.data
  },

  async updateMyProfile(payload: UpdateProfilePayload): Promise<AlumniProfile> {
    const { data } = await apiClient.put<ApiResponse<AlumniProfile>>(
      "/me/profile",
      payload,
    )
    return data.data
  },

  /** Authenticated photo bytes — avoids storage CORS for PDF export. */
  async getMyPhotoBlob(): Promise<Blob> {
    const { data } = await apiClient.get<Blob>("/me/photo", {
      responseType: "blob",
    })
    return data
  },
}

export const careerService = {
  async listProfessional(): Promise<ProfileProfessional[]> {
    const { data } = await apiClient.get<ApiResponse<ProfileProfessional[]>>(
      "/me/professional",
    )
    return data.data
  },

  async createProfessional(
    payload: CreateProfessionalPayload,
  ): Promise<ProfileProfessional> {
    const { data } = await apiClient.post<ApiResponse<ProfileProfessional>>(
      "/me/professional",
      payload,
    )
    return data.data
  },

  async updateProfessional(
    id: string,
    payload: UpdateProfessionalPayload,
  ): Promise<ProfileProfessional> {
    const { data } = await apiClient.put<ApiResponse<ProfileProfessional>>(
      `/me/professional/${id}`,
      payload,
    )
    return data.data
  },

  async deleteProfessional(id: string): Promise<void> {
    await apiClient.delete(`/me/professional/${id}`)
  },

  async listAcademic(): Promise<ProfileAcademic[]> {
    const { data } = await apiClient.get<ApiResponse<ProfileAcademic[]>>(
      "/me/academic",
    )
    return data.data
  },

  async createAcademic(
    payload: CreateAcademicPayload,
  ): Promise<ProfileAcademic> {
    const { data } = await apiClient.post<ApiResponse<ProfileAcademic>>(
      "/me/academic",
      payload,
    )
    return data.data
  },

  async updateAcademic(
    id: string,
    payload: UpdateAcademicPayload,
  ): Promise<ProfileAcademic> {
    const { data } = await apiClient.put<ApiResponse<ProfileAcademic>>(
      `/me/academic/${id}`,
      payload,
    )
    return data.data
  },

  async deleteAcademic(id: string): Promise<void> {
    await apiClient.delete(`/me/academic/${id}`)
  },
}
