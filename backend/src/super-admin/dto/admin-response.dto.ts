export interface BranchSummaryDto {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  admin_id?: number | null;
  is_active: number;
}

export class AdminResponseDto {
  id: number;
  fullname: string;
  email: string;
  profile_url: string | null;
  role: number;
  branch_id?: number | null;
  telegram_chat_id?: string | null;
  branch?: BranchSummaryDto | null;
  is_active: number;
  is_verified: number;
  created_at: Date;
  updated_at: Date;
}
