<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 max-w-md mx-auto relative justify-center">
    <!-- Camera Capture Component -->
    <CameraCapture
      :action-type="actionType"
      @captured="handleCapturedPhoto"
      @cancel="handleCancel"
    />

    <!-- Loading Spinner Overlay during API submit -->
    <LoadingSpinner
      v-if="attendanceStore.isLoading"
      :message="actionType === 'CHECK_IN' ? 'Submitting Check In...' : 'Submitting Check Out...'"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAttendanceStore } from '../stores/attendance.store';
import CameraCapture from '../components/CameraCapture.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const attendanceStore = useAttendanceStore();

const actionType = computed<'CHECK_IN' | 'CHECK_OUT'>(() => {
  return (route.query.action as 'CHECK_IN' | 'CHECK_OUT') || 'CHECK_IN';
});

async function handleCapturedPhoto(photoBlob: Blob) {
  // Fetch location coordinates if browser grants geolocation permission
  let lat: number | undefined;
  let lng: number | undefined;

  try {
    const coords = await getGeolocation();
    lat = coords.latitude;
    lng = coords.longitude;
  } catch (err) {
    console.warn('Geolocation unavailable or permission denied:', err);
  }

  let success = false;
  if (actionType.value === 'CHECK_IN') {
    success = await attendanceStore.submitCheckIn(photoBlob, lat, lng);
  } else {
    success = await attendanceStore.submitCheckOut(photoBlob, lat, lng);
  }

  if (success) {
    router.push({ name: 'home' });
  }
}

function handleCancel() {
  router.push({ name: 'home' });
}

function getGeolocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by this browser.'));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  });
}
</script>
