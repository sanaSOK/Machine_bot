import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { TodayStatus, AttendanceRecord } from '../types/attendance';
import {
  getTodayStatusApi,
  getAttendanceHistoryApi,
  postCheckInApi,
  postCheckOutApi,
} from '../services/attendance.service';

export const useAttendanceStore = defineStore('attendance', () => {
  const todayStatus = ref<TodayStatus>({
    checkIn: null,
    checkOut: null,
    status: 'NOT_CHECKED_IN',
    canCheckIn: true,
    canCheckOut: false,
  });

  const history = ref<AttendanceRecord[]>([]);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const successMessage = ref<string | null>(null);

  async function fetchTodayStatus() {
    isLoading.value = true;
    error.value = null;
    try {
      const data = await getTodayStatusApi();
      todayStatus.value = data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch today status';
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchHistory() {
    isLoading.value = true;
    error.value = null;
    try {
      const records = await getAttendanceHistoryApi();
      history.value = records;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch attendance history';
    } finally {
      isLoading.value = false;
    }
  }

  async function submitCheckIn(photoBlob: Blob, latitude?: number, longitude?: number): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;

    try {
      const formData = new FormData();
      formData.append('photo', photoBlob, `checkin-${Date.now()}.jpg`);
      if (latitude !== undefined && latitude !== null) {
        formData.append('latitude', latitude.toString());
      }
      if (longitude !== undefined && longitude !== null) {
        formData.append('longitude', longitude.toString());
      }

      await postCheckInApi(formData);
      successMessage.value = 'Check In Successful! Have a great day!';
      await fetchTodayStatus();
      return true;
    } catch (err: any) {
      error.value = err.message || 'Check in failed';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function submitCheckOut(photoBlob: Blob, latitude?: number, longitude?: number): Promise<boolean> {
    isLoading.value = true;
    error.value = null;
    successMessage.value = null;

    try {
      const formData = new FormData();
      formData.append('photo', photoBlob, `checkout-${Date.now()}.jpg`);
      if (latitude !== undefined && latitude !== null) {
        formData.append('latitude', latitude.toString());
      }
      if (longitude !== undefined && longitude !== null) {
        formData.append('longitude', longitude.toString());
      }

      await postCheckOutApi(formData);
      successMessage.value = 'Check Out Successful! See you next time!';
      await fetchTodayStatus();
      return true;
    } catch (err: any) {
      error.value = err.message || 'Check out failed';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    todayStatus,
    history,
    isLoading,
    error,
    successMessage,
    fetchTodayStatus,
    fetchHistory,
    submitCheckIn,
    submitCheckOut,
  };
});
