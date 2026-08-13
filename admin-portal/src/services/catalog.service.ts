import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"

export type CatalogCampus = {
  id: string
  code: string
  name: string
  city: string
}

export type CatalogDegreeProgram = {
  id: string
  degree_id: string
  program_id: string
  campus_id: string
  label: string
}

export const catalogService = {
  async listCampuses(): Promise<CatalogCampus[]> {
    const { data } = await apiClient.get<ApiResponse<CatalogCampus[]>>(
      "/catalog/campuses",
    )
    return data.data
  },

  async listDegreePrograms(campusId?: string): Promise<CatalogDegreeProgram[]> {
    const { data } = await apiClient.get<ApiResponse<CatalogDegreeProgram[]>>(
      "/catalog/degree-programs",
      {
        params: campusId ? { campus_id: campusId } : undefined,
      },
    )
    return data.data
  },
}
