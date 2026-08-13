import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"
import type { DirectoryAlumni, Paginated } from "@/types/portal"

export type DirectoryQuery = {
  name?: string
  graduation_year?: string
  degree_program_id?: string
  city?: string
  country?: string
  page?: number
  page_size?: number
}

export const directoryService = {
  async list(query: DirectoryQuery = {}): Promise<Paginated<DirectoryAlumni>> {
    const { data } = await apiClient.get<
      ApiResponse<Paginated<DirectoryAlumni>>
    >("/directory", { params: query })
    return data.data
  },

  async getOne(alumniId: string): Promise<DirectoryAlumni> {
    const { data } = await apiClient.get<ApiResponse<DirectoryAlumni>>(
      `/directory/${alumniId}`,
    )
    return data.data
  },
}
