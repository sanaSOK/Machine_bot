<template>
  <div class="flex flex-col items-center w-full max-w-md mx-auto">
    <!-- Camera Header Status -->
    <div class="w-full mb-4 flex items-center justify-between">
      <h3 class="text-lg font-bold text-white flex items-center gap-2">
        <Camera class="w-5 h-5 text-indigo-400" />
        {{ actionType === 'CHECK_IN' ? 'Check In (Dual Photo)' : 'Check Out (Dual Photo)' }}
      </h3>

      <!-- Current Step Badge -->
      <div class="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>{{ isCaptured ? 'Photo Ready' : (captureStep === 'FRONT' ? '1/2: Front Selfie' : '2/2: Back Camera') }}</span>
      </div>
    </div>

    <!-- Error State Container -->
    <div v-if="cameraError" class="w-full p-6 glass-panel rounded-3xl border border-red-500/30 text-center mb-6">
      <AlertCircle class="w-12 h-12 text-red-400 mx-auto mb-3 animate-bounce" />
      <h4 class="text-base font-bold text-red-200 mb-1">Camera Access Error</h4>
      <p class="text-xs text-red-300/80 mb-4 leading-relaxed">{{ cameraError }}</p>
      <button
        @click="startCamera(currentFacingMode)"
        class="py-2.5 px-5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
      >
        🔄 Retry Camera
      </button>
    </div>

    <!-- Camera Preview Container -->
    <div v-else class="relative w-full aspect-[3/4] bg-slate-950 rounded-3xl overflow-hidden border-2 border-slate-800 shadow-2xl mb-6">
      
      <!-- Live Video Stream -->
      <video
        ref="videoRef"
        v-show="!isCaptured && isStreaming"
        autoplay
        playsinline
        muted
        :class="[
          'w-full h-full object-cover transition-transform duration-300',
          currentFacingMode === 'user' ? 'transform -scale-x-100' : 'transform scale-x-100'
        ]"
      ></video>

      <!-- Active Camera Mode Badge -->
      <div v-if="!isCaptured && isStreaming" class="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-slate-900/80 text-indigo-300 text-[11px] font-semibold backdrop-blur-md border border-slate-700/60 flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        {{ currentFacingMode === 'user' ? '👤 Front Selfie Cam' : '🏢 Back Workplace Cam' }}
      </div>

      <!-- Quick Switch Camera Button on Video Overlay -->
      <button
        v-if="!isCaptured && isStreaming && !isAutoCapturing"
        @click="toggleFacingMode"
        class="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700/60 shadow-xl transition-all active:scale-90 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
      >
        <RefreshCw class="w-3.5 h-3.5 text-indigo-400" />
        <span>{{ currentFacingMode === 'user' ? 'Switch to Back' : 'Switch to Front' }}</span>
      </button>

      <!-- Front Snapshot Preview thumbnail if captured step 1 -->
      <div
        v-if="!isCaptured && frontPhotoDataUrl"
        class="absolute bottom-4 right-4 z-20 w-24 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-2xl bg-slate-900"
      >
        <img :src="frontPhotoDataUrl" alt="Front selfie snapshot" class="w-full h-full object-cover" />
        <div class="absolute bottom-0 inset-x-0 py-0.5 bg-emerald-950/90 text-[8px] font-bold text-center text-emerald-200">
          ✓ Selfie {{ frontTimeData?.timeOnly || '' }}
        </div>
      </div>

      <!-- Captured Composite Image Preview -->
      <img
        v-if="isCaptured && capturedImageUrl"
        :src="capturedImageUrl"
        alt="Captured dual snapshot with GPS overlay"
        class="w-full h-full object-cover"
      />

      <!-- Hidden canvas element for composite snapshot -->
      <canvas ref="canvasRef" class="hidden"></canvas>

      <!-- Camera Grid Lines -->
      <div v-if="!isCaptured && isStreaming" class="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 opacity-25">
        <div class="flex justify-between">
          <div class="w-8 h-8 border-t-2 border-l-2 border-white"></div>
          <div class="w-8 h-8 border-t-2 border-r-2 border-white"></div>
        </div>
        <div class="flex justify-between">
          <div class="w-8 h-8 border-b-2 border-l-2 border-white"></div>
          <div class="w-8 h-8 border-b-2 border-r-2 border-white"></div>
        </div>
      </div>

      <!-- Auto Capturing / Switching Overlay -->
      <div v-if="isAutoCapturing" class="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 text-center">
        <Loader2 class="w-10 h-10 text-indigo-400 animate-spin mb-3" />
        <h4 class="text-sm font-bold text-white mb-1">Capturing Dual Photo & Live Location...</h4>
        <p class="text-xs text-indigo-200 font-medium">{{ captureStep === 'FRONT' ? 'Taking Selfie Photo...' : 'Taking Back Camera Photo...' }}</p>
      </div>

      <!-- Loading overlay while initializing camera -->
      <div v-if="!isStreaming && !isCaptured && !cameraError && !isAutoCapturing" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 p-4">
        <Loader2 class="w-10 h-10 text-indigo-400 animate-spin mb-2" />
        <p class="text-xs text-slate-300 font-medium">Opening {{ currentFacingMode === 'user' ? 'Front Selfie' : 'Back' }} Camera...</p>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="w-full flex flex-col gap-3">
      <!-- Live State: Capture Dual Photo Button -->
      <button
        v-if="!isCaptured && isStreaming && !isAutoCapturing"
        @click="startAutoDualCapture"
        class="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-600 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 transform active:scale-98 transition-all glow-indigo cursor-pointer"
      >
        <div class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
          <div class="w-3 h-3 bg-white rounded-full"></div>
        </div>
        <span>📷 Capture Dual Photo (Front + Back)</span>
      </button>

      <!-- Captured State: Confirm / Retake Buttons -->
      <div v-if="isCaptured" class="flex gap-3 w-full">
        <button
          @click="retakePhoto"
          class="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RotateCcw class="w-4 h-4" />
          <span>Retake</span>
        </button>

        <button
          @click="confirmPhoto"
          class="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 glow-emerald cursor-pointer"
        >
          <Check class="w-4 h-4" />
          <span>Confirm & Submit</span>
        </button>
      </div>

      <!-- Cancel Button -->
      <button
        @click="$emit('cancel')"
        class="w-full py-3 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 font-semibold rounded-2xl border border-slate-800/80 transition-all text-sm cursor-pointer"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Camera, AlertCircle, Loader2, RotateCcw, Check, RefreshCw } from 'lucide-vue-next';

defineProps<{
  actionType: 'CHECK_IN' | 'CHECK_OUT';
}>();

const emit = defineEmits<{
  (e: 'captured', blob: Blob): void;
  (e: 'cancel'): void;
}>();

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const isStreaming = ref<boolean>(false);
const isCaptured = ref<boolean>(false);
const isAutoCapturing = ref<boolean>(false);
const cameraError = ref<string | null>(null);
const capturedImageUrl = ref<string | null>(null);
const currentFacingMode = ref<'user' | 'environment'>('user');
const captureStep = ref<'FRONT' | 'BACK'>('FRONT');

const frontPhotoDataUrl = ref<string | null>(null);

interface TimeInfo {
  full: string;
  timeOnly: string;
}

const frontTimeData = ref<TimeInfo | null>(null);
const rearTimeData = ref<TimeInfo | null>(null);

let frontImageElement: HTMLImageElement | null = null;
let backImageElement: HTMLImageElement | null = null;
let capturedBlob: Blob | null = null;
let mediaStream: MediaStream | null = null;

async function startCamera(facing: 'user' | 'environment' = 'user') {
  cameraError.value = null;
  isStreaming.value = false;
  currentFacingMode.value = facing;

  stopCamera();

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    cameraError.value = 'Camera API is not supported in this browser environment.';
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    });

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream;
      videoRef.value.onloadedmetadata = () => {
        videoRef.value?.play();
        isStreaming.value = true;
      };
    }
  } catch (err: any) {
    console.warn(`Facing mode ${facing} failed, trying default camera:`, err);
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (videoRef.value) {
        videoRef.value.srcObject = mediaStream;
        videoRef.value.onloadedmetadata = () => {
          videoRef.value?.play();
          isStreaming.value = true;
        };
      }
    } catch (e: any) {
      cameraError.value = e.message || 'Failed to open device camera.';
    }
  }
}

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
  isStreaming.value = false;
}

async function toggleFacingMode() {
  const nextFacing = currentFacingMode.value === 'user' ? 'environment' : 'user';
  await startCamera(nextFacing);
}

/**
 * Executes seamless 2-step Dual Photo capture (Front Selfie + Back Workplace)
 * with Timestamps & Live GPS City/Province Overlay
 */
async function startAutoDualCapture() {
  if (isAutoCapturing.value) return;
  isAutoCapturing.value = true;

  try {
    // 1. Front Selfie Photo
    if (currentFacingMode.value !== 'user' || !isStreaming.value) {
      await startCamera('user');
      await new Promise((r) => setTimeout(r, 600));
    }

    frontTimeData.value = formatDateTimeStr(new Date());
    const frontDataUrl = captureCurrentStreamToDataUrl(true);
    frontPhotoDataUrl.value = frontDataUrl;
    frontImageElement = await loadImage(frontDataUrl);

    captureStep.value = 'BACK';

    // 2. Back Camera Photo
    await startCamera('environment');
    await new Promise((r) => setTimeout(r, 800));

    rearTimeData.value = formatDateTimeStr(new Date());
    const backDataUrl = captureCurrentStreamToDataUrl(false);
    backImageElement = await loadImage(backDataUrl);

    // 3. Fetch Live Device GPS & City/Province Location Name
    const gpsData = await getDeviceGPS();

    // 4. Create Dual Composite Snapshot with Overlay (Rear, Front, Final timestamps & GPS location)
    await createCompositeDualPhoto(gpsData);
  } catch (err: any) {
    console.error('Auto dual capture error:', err);
    const fallbackGps = { lat: 11.5564, lng: 104.9282, locationName: 'Phnom Penh' };
    await createCompositeDualPhoto(fallbackGps);
  } finally {
    isAutoCapturing.value = false;
  }
}

function captureCurrentStreamToDataUrl(isFront: boolean): string {
  if (!videoRef.value) return '';

  const video = videoRef.value;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = video.videoWidth || 1280;
  tempCanvas.height = video.videoHeight || 960;

  const ctx = tempCanvas.getContext('2d');
  if (!ctx) return '';

  if (isFront) {
    ctx.translate(tempCanvas.width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
  return tempCanvas.toDataURL('image/jpeg', 0.88);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

async function createCompositeDualPhoto(gpsData: { lat: number; lng: number; locationName: string }) {
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = backImageElement?.width || frontImageElement?.width || 1280;
  const height = backImageElement?.height || frontImageElement?.height || 960;

  canvas.width = width;
  canvas.height = height;

  // 1. Draw Back Workplace photo as main background
  if (backImageElement) {
    ctx.drawImage(backImageElement, 0, 0, width, height);
  } else if (frontImageElement) {
    ctx.drawImage(frontImageElement, 0, 0, width, height);
  }

  const finalTimeData = formatDateTimeStr(new Date());
  const rearTime = rearTimeData.value || finalTimeData;
  const frontTime = frontTimeData.value || finalTimeData;

  // 2. Draw Inset Front Selfie Photo in bottom-right corner with "Selfie HH:mm:ss" tag
  if (frontImageElement) {
    const insetWidth = Math.round(width * 0.30);
    const insetHeight = Math.round(insetWidth * (4 / 3));
    const insetX = width - insetWidth - 30;
    const insetY = height - insetHeight - 30;

    ctx.save();
    // Clip rounded rect for Selfie PIP frame
    ctx.beginPath();
    ctx.roundRect(insetX, insetY, insetWidth, insetHeight, 18);
    ctx.clip();
    ctx.drawImage(frontImageElement, 0, 0, frontImageElement.width, frontImageElement.height, insetX, insetY, insetWidth, insetHeight);
    ctx.restore();

    // Draw stroke border around Selfie frame
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(insetX, insetY, insetWidth, insetHeight, 18);
    ctx.stroke();
    ctx.restore();

    // Draw "Selfie HH:mm:ss" label bar at bottom of PIP frame
    ctx.save();
    const tagHeight = Math.round(insetHeight * 0.16);
    const tagY = insetY + insetHeight - tagHeight;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(insetX, tagY, insetWidth, tagHeight, [0, 0, 18, 18]);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(tagHeight * 0.60)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Selfie ${frontTime.timeOnly}`, insetX + insetWidth / 2, tagY + tagHeight / 2);
    ctx.restore();
  }

  // 3. Draw Bottom-Left Dark Overlay Box with Timestamps (Rear, Front, Final) & GPS Location (City/Province)
  const lines: string[] = [
    `Rear:  ${rearTime.full}`,
    `Front: ${frontTime.full}`,
    ``,
    `Final: ${finalTimeData.full}`,
    `GPS: ${gpsData.lat.toFixed(6)}, ${gpsData.lng.toFixed(6)}`,
  ];
  if (gpsData.locationName) {
    lines.push(`Location: ${gpsData.locationName}`);
  }

  const fontSize = Math.max(16, Math.round(width * 0.022));
  const lineHeight = Math.round(fontSize * 1.45);
  const padding = Math.round(fontSize * 0.9);

  ctx.save();
  ctx.font = `bold ${fontSize}px monospace, sans-serif`;

  let maxTextWidth = 0;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    if (w > maxTextWidth) maxTextWidth = w;
  }

  const boxWidth = maxTextWidth + padding * 2;
  const boxHeight = lines.length * lineHeight + padding * 2;

  // Position box at bottom-left corner
  const boxX = 30;
  const boxY = height - boxHeight - 30;

  // Dark semi-transparent slate container
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 18);
  ctx.fill();
  ctx.stroke();

  // Draw text lines inside box
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  lines.forEach((line, idx) => {
    if (line) {
      const lineY = boxY + padding + idx * lineHeight;
      if (line.startsWith('Final:')) {
        ctx.fillStyle = '#60a5fa'; // Bright blue for Final
      } else if (line.startsWith('GPS:') || line.startsWith('Location:')) {
        ctx.fillStyle = '#34d399'; // Emerald green for GPS & City/Province
      } else {
        ctx.fillStyle = '#f8fafc'; // White for Rear & Front
      }
      ctx.fillText(line, boxX + padding, lineY);
    }
  });

  ctx.restore();

  // Compress into JPEG Blob
  return new Promise<void>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          capturedBlob = blob;
          capturedImageUrl.value = URL.createObjectURL(blob);
          isCaptured.value = true;
          stopCamera();
        }
        resolve();
      },
      'image/jpeg',
      0.90,
    );
  });
}

function retakePhoto() {
  if (capturedImageUrl.value) {
    URL.revokeObjectURL(capturedImageUrl.value);
    capturedImageUrl.value = null;
  }
  frontPhotoDataUrl.value = null;
  frontTimeData.value = null;
  rearTimeData.value = null;
  frontImageElement = null;
  backImageElement = null;
  capturedBlob = null;
  isCaptured.value = false;
  captureStep.value = 'FRONT';
  startCamera('user');
}

function confirmPhoto() {
  if (capturedBlob) {
    emit('captured', capturedBlob);
  }
}

function formatDateTimeStr(date: Date): TimeInfo {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return {
    full: `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`,
    timeOnly: `${hours}:${minutes}:${seconds}`,
  };
}

async function getDeviceGPS(): Promise<{ lat: number; lng: number; locationName: string }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve({ lat: 11.5564, lng: 104.9282, locationName: 'Phnom Penh, Cambodia' });
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const locationName = await fetchCityProvinceCountry(lat, lng);
        resolve({ lat, lng, locationName });
      },
      () => {
        resolve({ lat: 11.5564, lng: 104.9282, locationName: 'Phnom Penh, Cambodia' });
      },
      { timeout: 6000, enableHighAccuracy: true, maximumAge: 0 },
    );
  });
}

async function fetchCityProvinceCountry(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
    );
    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        const a = data.address;
        const cityOrProvince = a.state || a.city || a.province || a.town || a.county || a.municipality || a.region;
        const country = a.country;
        if (cityOrProvince && country) {
          return `${cityOrProvince}, ${country}`;
        }
        if (cityOrProvince) return cityOrProvince;
        if (country) return country;
      }
    }
  } catch (err) {
    console.warn('City/Province/Country lookup error:', err);
  }
  return 'Phnom Penh, Cambodia';
}

onMounted(() => {
  startCamera('user');
});

onBeforeUnmount(() => {
  stopCamera();
  if (capturedImageUrl.value) {
    URL.revokeObjectURL(capturedImageUrl.value);
  }
});
</script>

