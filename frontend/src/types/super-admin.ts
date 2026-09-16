export interface AdminUser {
  id: number;
  fullname: string;
  email: string;
  profile_url: string | null;
  role: number; // 1 = SUPER_ADMIN, 2 = ADMIN
  is_active: number; // 1 = Active, 0 = Inactive
  is_verified: number; // 1 = Verified, 0 = Unverified
  created_at: string;
  updated_at: string;
}

export interface SuperAdminStats {
  totalAdmins: number;
  totalActiveStaff: number;
  totalTodayCheckIns: number;
}

export interface CreateAdminDto {
  fullname: string;
  email: string;
  password?: string;
  profile_url?: string | null;
}
