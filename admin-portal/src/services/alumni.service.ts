import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

export type AdminAlumniDegreeProgram = {
  id: string
  degree_id: string
  degree: string
  degree_code: string
  program_id: string
  program: string
  department: string | null
  campus: string | null
}

export type AdminAlumniProfessional = {
  current_company: string | null
  job_title: string | null
  role: string | null
}

export type AdminAlumniListItem = {
  alumni_id: string
  full_name: string
  email: string
  phone_number: string | null
  whatsapp_number: string | null
  city: string | null
  country: string | null
  photo_url: string | null
  graduation_year: string | null
  registration_roll_number: string | null
  degree_program_id: string | null
  degree_program: AdminAlumniDegreeProgram | null
  professional: AdminAlumniProfessional | null
}

export type AdminAlumniListResponse = {
  items: AdminAlumniListItem[]
  total: number
  page: number
  page_size: number
  analytics?: unknown
}

export type AdminAlumniListParams = {
  search?: string
  graduation_year?: string
  city?: string
  country?: string
  degree_program_id?: string
  department?: string
  role?: string
  page?: number
  page_size?: number
}

export type DirectoryAcademic = {
  degree_program_id: string
  graduation_year: string
}

export type DirectoryProfessional = {
  current_company: string | null
  job_title: string | null
  role: string | null
}

export type DirectoryAlumniProfile = {
  alumni_id: string
  full_name: string
  city: string | null
  country: string | null
  photo_url: string | null
  academic: DirectoryAcademic[]
  professional: DirectoryProfessional[]
  is_contact_revealed: boolean
  email: string
  phone_number: string | null
  whatsapp_number: string | null
  address: string | null
  secondry_address: string | null
  linkedin_url: string | null
  primary_graduation_year?: string | null
  primary_role?: string | null
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export const alumniService = {
  async list(
    token: string,
    params: AdminAlumniListParams = {},
  ): Promise<AdminAlumniListResponse> {
    const { data } = await apiClient.get<ApiResponse<AdminAlumniListResponse>>(
      "/admin/alumni",
      {
        headers: authHeaders(token),
        params: {
          search: params.search || undefined,
          graduation_year: params.graduation_year || undefined,
          city: params.city || undefined,
          country: params.country || undefined,
          degree_program_id: params.degree_program_id || undefined,
          department: params.department || undefined,
          role: params.role || undefined,
          page: params.page ?? 1,
          page_size: params.page_size ?? 20,
        },
      },
    )
    return data.data
  },

  async getDirectoryProfile(
    token: string,
    alumniId: string,
  ): Promise<DirectoryAlumniProfile> {
    const { data } = await apiClient.get<ApiResponse<DirectoryAlumniProfile>>(
      `/directory/${alumniId}`,
      {
        headers: authHeaders(token),
      },
    )
    return data.data
  },
}
