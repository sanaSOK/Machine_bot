<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Ambient Background Glows -->
    <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>
    <div class="absolute bottom-10 right-10 w-[350px] h-[350px] bg-purple-600/15 blur-[100px] rounded-full pointer-events-none"></div>

    <div class="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10 text-center space-y-6">
      <!-- App Header Branding -->
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 mb-2 shadow-inner">
        <MailCheck v-if="state === 'success'" class="w-8 h-8 text-emerald-400" />
        <AlertTriangle v-else-if="state === 'error'" class="w-8 h-8 text-rose-400" />
        <Loader2 v-else class="w-8 h-8 animate-spin text-indigo-400" />
      </div>

      <div>
        <h1 class="text-2xl font-black text-white tracking-tight">Email Verification</h1>
        <p class="text-xs text-slate-400 mt-1">eRoxii Attendance System Account Activation</p>
      </div>

      <!-- Loading State -->
      <div v-if="state === 'verifying'" class="py-6 space-y-3">
        <p class="text-sm font-semibold text-slate-300">Validating your email token...</p>
        <p class="text-xs text-slate-500">Please wait a moment while we verify your account.</p>
      </div>

      <!-- Success State -->
      <div v-else-if="state === 'success'" class="py-4 space-y-4">
        <div class="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold leading-relaxed">
          {{ message || 'Email confirmed successfully! Your account is now active.' }}
        </div>
        <router-link
          to="/admin/login"
          class="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg glow-indigo cursor-pointer"
        >
          <LogIn class="w-4 h-4" />
          <span>Proceed to Admin Login</span>
        </router-link>
      </div>

      <!-- Error State -->
      <div v-else-if="state === 'error'" class="py-4 space-y-4">
        <div class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold leading-relaxed">
          {{ message || 'Verification token is invalid or has expired.' }}
        </div>

        <div class="pt-2 border-t border-slate-800/80 text-left space-y-3">
          <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Resend Verification Link</label>
          <div class="flex items-center gap-2">
            <input
              v-model="resendEmail"
              type="email"
              placeholder="Enter your admin email"
              class="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              @click="handleResend"
              :disabled="isResending"
              class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send class="w-3.5 h-3.5" />
              <span>Resend</span>
            </button>
          </div>
          <p v-if="resendMessage" class="text-[11px] font-semibold text-emerald-400 mt-1">{{ resendMessage }}</p>
        </div>

        <router-link
          to="/admin/login"
          class="block text-xs font-bold text-slate-400 hover:text-white transition-colors pt-2"
        >
          &larr; Back to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { MailCheck, AlertTriangle, Loader2, LogIn, Send } from 'lucide-vue-next';
import { authApi } from '../services/auth.api';

const route = useRoute();
const state = ref<'verifying' | 'success' | 'error'>('verifying');
const message = ref<string>('');

const resendEmail = ref<string>('');
const isResending = ref<boolean>(false);
const resendMessage = ref<string>('');

onMounted(async () => {
  const token = route.query.token as string;
  if (!token) {
    state.value = 'error';
    message.value = 'No verification token was provided in the URL query string.';
    return;
  }

  try {
    const res = await authApi.verifyEmail(token);
    state.value = 'success';
    message.value = res.message || 'Email verified successfully!';
  } catch (err: any) {
    state.value = 'error';
    message.value = err.message || 'Verification token is invalid or expired.';
  }
});

async function handleResend() {
  if (!resendEmail.value.trim()) {
    resendMessage.value = 'Please enter your email address.';
    return;
  }
  isResending.value = true;
  resendMessage.value = '';
  try {
    const res = await authApi.resendVerification(resendEmail.value.trim());
    resendMessage.value = res.message || 'Verification link resent to your email!';
  } catch (err: any) {
    resendMessage.value = err.message || 'Failed to resend verification email.';
  } finally {
    isResending.value = false;
  }
}
</script>
