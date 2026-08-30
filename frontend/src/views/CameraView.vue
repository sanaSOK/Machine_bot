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
      v-if="attendanceStore.isLoading || isGeocoding"
      :message="isGeocoding ? 'Detecting Live Google Maps GPS...' : (actionType === 'CHECK_IN' ? 'Submitting Check In...' : 'Submitting Check Out...')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAttendanceStore } from '../stores/attendance.store';
import CameraCapture from '../components/CameraCapture.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const attendanceStore = useAttendanceStore();

const isGeocoding = ref<boolean>(false);

const actionType = computed<'CHECK_IN' | 'CHECK_OUT'>(() => {
  return (route.query.action as 'CHECK_IN' | 'CHECK_OUT') || 'CHECK_IN';
});

async function handleCapturedPhoto(photoBlob: Blob) {
  let lat: number | undefined;
  let lng: number | undefined;
  let address: string | undefined;

  isGeocoding.value = true;

  try {
    // Read live fresh GPS coordinates from device satellite/cellular sensor (zero cache)
    const coords = await getLiveGeolocation();
    lat = coords.latitude;
    lng = coords.longitude;
    address = await reverseGeocodeAddress(lat, lng);
  } catch (err) {
    console.warn('Live Geolocation unavailable or permission denied:', err);
    // Never fallback to hardcoded text - preserve live GPS coordinates only
    lat = undefined;
    lng = undefined;
    address = undefined;
  } finally {
    isGeocoding.value = false;
  }

  let success = false;
  if (actionType.value === 'CHECK_IN') {
    success = await attendanceStore.submitCheckIn(photoBlob, lat, lng, address);
  } else {
    success = await attendanceStore.submitCheckOut(photoBlob, lat, lng, address);
  }

  if (success) {
    router.push({ name: 'home' });
  }
}

function handleCancel() {
  router.push({ name: 'home' });
}

/**
 * Fetches real-time fresh GPS coordinates from device satellite/cellular sensor
 */
function getLiveGeolocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by this device environment.'));
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
      {
        timeout: 10000,
        enableHighAccuracy: true,
        maximumAge: 0, // Force fresh live GPS sensor query (zero cache)
      },
    );
  });
}

async function reverseGeocodeAddress(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch (err) {
    console.warn('Reverse geocode fetch failed:', err);
  }
  return `Live GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
}
</script>
