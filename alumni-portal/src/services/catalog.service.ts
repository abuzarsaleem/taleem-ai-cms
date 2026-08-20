import { apiClient } from "@/lib/api-client"
import type { ApiResponse } from "@/types/api"
import type { Campus, DegreeProgram } from "@/types/portal"

let cachedPrograms: DegreeProgram[] | null = null
let cachedCampuses: Campus[] | null = null

export const catalogService = {
  async listCampuses(): Promise<Campus[]> {
    if (cachedCampuses) return cachedCampuses
    const { data } = await apiClient.get<ApiResponse<Campus[]>>(
      "/catalog/campuses",
    )
    cachedCampuses = data.data
    return cachedCampuses
  },

  async listDegreePrograms(campusId?: string): Promise<DegreeProgram[]> {
    const { data } = await apiClient.get<ApiResponse<DegreeProgram[]>>(
      "/catalog/degree-programs",
      { params: campusId ? { campus_id: campusId } : undefined },
    )
    return data.data
  },

  async getDegreeProgramMap(): Promise<Map<string, string>> {
    if (!cachedPrograms) {
      cachedPrograms = await this.listDegreePrograms()
    }
    return new Map(cachedPrograms.map((item) => [item.id, item.label]))
  },

  async labelFor(degreeProgramId: string | null | undefined): Promise<string | null> {
    if (!degreeProgramId) return null
    const map = await this.getDegreeProgramMap()
    return map.get(degreeProgramId) ?? null
  },
}
