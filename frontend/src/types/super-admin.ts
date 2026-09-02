export interface AdminOrgItem {
  id: string;
  companyName: string;
  adminUsername: string;
  contactEmail: string;
  logoUrl?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  workStartTime: string;
  workEndTime: string;
  gracePeriodMinutes: number;
  telegramBotToken?: string;
  telegramNotificationChatId?: string;
  createdAt: string;
  totalEmployees?: number;
  todayCheckIns?: number;
}

export interface SuperAdminStats {
  totalAdminOrgs: number;
  activeAdminOrgs: number;
  suspendedAdminOrgs: number;
  totalSystemEmployees: number;
  totalTodayCheckIns: number;
}
