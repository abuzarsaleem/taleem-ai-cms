export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  page_size: number
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

/** Matches Swagger DirectoryAlumniCardDto */
export type DirectoryAlumni = {
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

export type ProfileAcademic = {
  id: string
  degree_program_id: string
  registration_roll_number: string
  registration_year: string | null
  graduation_year: string
  cgpa: number | null
  is_verification: boolean
}

export type ProfileProfessional = {
  id: string
  current_company: string | null
  job_title: string | null
  role: string | null
  start_date: string
  end_date: string | null
}

/** Matches Swagger AlumniProfileResponseDto */
export type AlumniProfile = {
  alumni_id: string
  full_name: string
  email: string
  status: string
  phone_number: string | null
  whatsapp_number: string | null
  cnic_national_id: string
  address: string | null
  secondry_address: string | null
  city: string | null
  country: string | null
  gender: string | null
  date_of_birth: string | null
  linkedin_url: string | null
  photo_url: string | null
  qr_code: string | null
  academic: ProfileAcademic[]
  professional: ProfileProfessional[]
}

export type UpdateProfilePayload = {
  phone_number?: string
  whatsapp_number?: string
  address?: string
  secondry_address?: string
  city?: string
  country?: string
  gender?: string
  date_of_birth?: string
  linkedin_url?: string
}

export type CreateProfessionalPayload = {
  current_company?: string
  job_title?: string
  role?: string
  start_date: string
}

export type UpdateProfessionalPayload = {
  current_company?: string
  job_title?: string
  role?: string
  start_date?: string
  end_date?: string | null
}

export type CreateAcademicPayload = {
  degree_program_id: string
  registration_roll_number: string
  registration_year: string
  graduation_year: string
  cgpa?: number
}

export type UpdateAcademicPayload = {
  degree_program_id?: string
  registration_roll_number?: string
  registration_year?: string
  graduation_year?: string
  cgpa?: number | null
}

export type DegreeProgram = {
  id: string
  degree_id: string
  program_id: string
  campus_id: string | null
  label: string
}

export type ContactRequest = {
  id: string
  requester_alumni_id: string
  target_alumni_id: string
  request_reason: string
  status: string
  admin_id: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export type EventItem = {
  id: string
  title: string
  description: string | null
  event_type: string
  event_date: string
  start_time: string
  end_time: string | null
  venue: string
  guest_speaker: string | null
  image_url: string | null
  my_rsvp_status: string | null
  rsvp_counts?: {
    going: number
    not_going: number
    maybe: number
    total: number
  }
}

export type AnnouncementItem = {
  id: string
  title: string
  content: string
  category: string
  image_url: string | null
  is_published: boolean
  published_at: string | null
}
