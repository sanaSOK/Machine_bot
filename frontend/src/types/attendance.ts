export type AttendanceAction = 'CHECK_IN' | 'CHECK_OUT';

export interface AttendanceRecord {
  id: number;
  user_id: number;
  action: AttendanceAction;
  photo_url: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface TodayStatus {
  checkIn: AttendanceRecord | null;
  checkOut: AttendanceRecord | null;
  status: 'NOT_CHECKED_IN' | 'WORKING' | 'COMPLETED';
  canCheckIn: boolean;
  canCheckOut: boolean;
}

export interface CheckInPayload {
  photo: Blob;
  latitude?: number;
  longitude?: number;
}

export interface CheckOutPayload {
  photo: Blob;
  latitude?: number;
  longitude?: number;
}
