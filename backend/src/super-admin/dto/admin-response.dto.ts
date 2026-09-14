export class AdminResponseDto {
  id: number;
  fullname: string;
  email: string;
  profile_url: string | null;
  role: number;
  is_active: number;
  is_verified: number;
  created_at: Date;
  updated_at: Date;
}
