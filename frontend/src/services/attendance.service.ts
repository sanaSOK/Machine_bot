import api from './api';
import type { User } from '../types/user';
import type { TodayStatus, AttendanceRecord } from '../types/attendance';

export async function authenticateTelegramApi(initData: string): Promise<{ accessToken: string; user: User }> {
  const response = await api.post<{ accessToken: string; user: User }>('/auth/telegram', { initData });
  return response.data;
}

export async function getTodayStatusApi(): Promise<TodayStatus> {
  const response = await api.get<TodayStatus>('/attendance/today');
  return response.data;
}

export async function getAttendanceHistoryApi(): Promise<AttendanceRecord[]> {
  const response = await api.get<AttendanceRecord[]>('/attendance/history');
  return response.data;
}

export async function postCheckInApi(formData: FormData): Promise<AttendanceRecord> {
  const response = await api.post<AttendanceRecord>('/attendance/check-in', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function postCheckOutApi(formData: FormData): Promise<AttendanceRecord> {
  const response = await api.post<AttendanceRecord>('/attendance/check-out', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}
