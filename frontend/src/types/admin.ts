export interface AdminStats {
  totalEmployees: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  todayAbsents?: number;
}

export interface DepartmentItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  userCount?: number;
}

export interface SystemSettings {
  companyName: string;
  logoUrl?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  isSuspended?: boolean;
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
  requireGps: boolean;
  requireDualPhoto: boolean;
  pageSize: number;
  telegramBotToken?: string;
  departments?: DepartmentItem[];
}

export interface AdminUser {
  id: number;
  telegram_user_id: string;
  username: string | null;
  first_name: string;
  last_name: string | null;
  photo_url: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  totalAttendances?: number;
  todayCheckIn?: { created_at: string } | null;
  todayCheckOut?: { created_at: string } | null;
}

export interface AdminEmployeeResponse {
  data: AdminUser[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminAttendanceRecord {
  id: number;
  user_id: number;
  action: 'CHECK_IN' | 'CHECK_OUT';
  photo_url: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  created_at: string;
  user: AdminUser;
}

export interface AdminAttendanceResponse {
  data: AdminAttendanceRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminAttendanceFilter {
  search: string;
  type: '' | 'CHECK_IN' | 'CHECK_OUT';
  date: string;
  status?: string;
  limit: number;
  offset: number;
}

export interface AdminEmployeeFilter {
  search: string;
  department?: string;
  role?: string;
  limit: number;
  offset: number;
}
