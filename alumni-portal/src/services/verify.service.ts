import { apiClient } from '@/lib/api-client'

export type AlumniVerifyResponse = {
  is_valid: boolean
  status?: string | null
  message?: string | null
  public_alumni_code?: string | null
  full_name?: string | null
  photo_url?: string | null
  degree_label?: string | null
  graduation_year?: string | null
  registration_roll_number?: string | null
  verified_at?: string | null
}

export async function verifyAlumniCard(
  alumniId: string,
): Promise<AlumniVerifyResponse> {
  const { data } = await apiClient.get<AlumniVerifyResponse>(
    `/public/alumni/${encodeURIComponent(alumniId)}/verify`,
  )
  return data
}
