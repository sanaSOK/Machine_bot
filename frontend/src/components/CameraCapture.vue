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
        class="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700/60 shadow-xl transition-all active:scale-90 flex items-center gap-1.5 text-xs font-bold"
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
          ✓ Selfie Taken
        </div>
      </div>

      <!-- Captured Composite Image Preview -->
      <img
        v-if="isCaptured && capturedImageUrl"
        :src="capturedImageUrl"
        alt="Captured dual snapshot"
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
        <h4 class="text-sm font-bold text-white mb-1">Capturing Dual Photo...</h4>
        <p class="text-xs text-indigo-200 font-medium">Switching to {{ currentFacingMode === 'user' ? 'Front Selfie' : 'Back Camera' }}</p>
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
        class="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-600 to-emerald-500 hover:from-indigo-400 hover:to-emerald-400 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 transform active:scale-98 transition-all glow-indigo"
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
          class="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl border border-slate-700 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw class="w-4 h-4" />
          <span>Retake</span>
        </button>

        <button
          @click="confirmPhoto"
          class="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 glow-emerald"
        >
          <Check class="w-4 h-4" />
          <span>Confirm & Submit</span>
        </button>
      </div>

      <!-- Cancel Button -->
      <button
        @click="$emit('cancel')"
        class="w-full py-3 bg-slate-900/60 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 font-semibold rounded-2xl border border-slate-800/80 transition-all text-sm"
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
 * 100% compatible with iOS Safari & Android WebKit
 */
async function startAutoDualCapture() {
  if (isAutoCapturing.value) return;
  isAutoCapturing.value = true;

  try {
    // 1. Ensure Front Selfie Camera is active and capture Front Photo
    if (currentFacingMode.value !== 'user' || !isStreaming.value) {
      await startCamera('user');
      await new Promise((r) => setTimeout(r, 600));
    }

    const frontDataUrl = captureCurrentStreamToDataUrl(true);
    frontPhotoDataUrl.value = frontDataUrl;
    frontImageElement = await loadImage(frontDataUrl);

    captureStep.value = 'BACK';

    // 2. Switch to Back Camera and capture Back Photo
    await startCamera('environment');
    await new Promise((r) => setTimeout(r, 800));

    const backDataUrl = captureCurrentStreamToDataUrl(false);
    backImageElement = await loadImage(backDataUrl);

    // 3. Create Dual Composite Snapshot (Back Workplace + Inset Front Selfie)
    createCompositeDualPhoto();
  } catch (err: any) {
    console.error('Auto dual capture error:', err);
    // Fallback single capture if device fails second camera
    createCompositeDualPhoto();
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

function createCompositeDualPhoto() {
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

  // 2. Draw Inset Front Selfie Photo in top-right corner
  if (frontImageElement && backImageElement) {
    const insetWidth = Math.round(width * 0.32);
    const insetHeight = Math.round(insetWidth * (4 / 3));
    const insetX = width - insetWidth - 30;
    const insetY = 30;

    ctx.save();
    // Rounded border clip for inset PIP selfie frame
    ctx.beginPath();
    ctx.roundRect(insetX, insetY, insetWidth, insetHeight, 20);
    ctx.clip();
    ctx.drawImage(frontImageElement, 0, 0, frontImageElement.width, frontImageElement.height, insetX, insetY, insetWidth, insetHeight);
    ctx.restore();

    // Draw border stroke around inset selfie frame
    ctx.save();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(insetX, insetY, insetWidth, insetHeight, 20);
    ctx.stroke();
    ctx.restore();
  }

  // Compress into JPEG Blob
  canvas.toBlob(
    (blob) => {
      if (blob) {
        capturedBlob = blob;
        capturedImageUrl.value = URL.createObjectURL(blob);
        isCaptured.value = true;
        stopCamera();
      }
    },
    'image/jpeg',
    0.88,
  );
}

function retakePhoto() {
  if (capturedImageUrl.value) {
    URL.revokeObjectURL(capturedImageUrl.value);
    capturedImageUrl.value = null;
  }
  frontPhotoDataUrl.value = null;
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
