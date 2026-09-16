<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background Glows -->
    <div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 blur-[140px] rounded-full pointer-events-none"></div>
    <div class="absolute bottom-10 left-10 w-[400px] h-[400px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none"></div>

    <div class="w-full max-w-md glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10 space-y-6">
      <!-- Header -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
          <ShieldCheck class="w-7 h-7" />
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight">Admin Portal</h1>
        <p class="text-xs text-slate-400">Log in with your administrator credentials</p>
      </div>

      <!-- Error Alert -->
      <div v-if="authStore.error" class="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold space-y-2">
        <div class="flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-rose-400 shrink-0" />
          <span>{{ authStore.error }}</span>
        </div>
        <div v-if="authStore.error.toLowerCase().includes('confirm your email')" class="pt-2 border-t border-rose-500/20">
          <button @click="showResendModal = true" class="text-amber-400 hover:underline font-bold text-[11px]">
            Click here to resend confirmation email
          </button>
        </div>
      </div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="space-y-1.5">
          <label class="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300">Email Address</label>
          <div class="relative">
            <input
              v-model="email"
              type="email"
              required
              placeholder="admin@example.com"
              class="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <Mail class="w-4 h-4 text-slate-500 absolute right-4 top-3.5" />
          </div>
        </div>

        <div class="space-y-1.5">
          <label class="block text-[11px] font-extrabold uppercase tracking-wider text-slate-300">Password</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              placeholder="••••••••••••"
              class="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          type="submit"
          :disabled="authStore.isLoading"
          class="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg glow-amber cursor-pointer disabled:opacity-50 mt-2"
        >
          <Loader2 v-if="authStore.isLoading" class="w-4 h-4 animate-spin" />
          <LogIn v-else class="w-4 h-4" />
          <span>Log In to Console</span>
        </button>
      </form>

      <!-- Footer Note -->
      <div class="text-center pt-2 border-t border-slate-900">
        <router-link to="/" class="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          &larr; Return to Staff Attendance Portal
        </router-link>
      </div>

      <!-- Resend Verification Modal -->
      <div v-if="showResendModal" class="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
        <div class="glass-panel p-6 rounded-3xl border border-slate-800 max-w-sm w-full space-y-4">
          <h3 class="text-lg font-bold text-white">Resend Verification Email</h3>
          <p class="text-xs text-slate-400">Enter your email address to receive a new activation link.</p>
          <input
            v-model="resendEmail"
            type="email"
            placeholder="admin@example.com"
            class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <div v-if="resendStatusMessage" class="text-xs font-semibold text-emerald-400">
            {{ resendStatusMessage }}
          </div>
          <div class="flex items-center gap-2 justify-end">
            <button
              @click="showResendModal = false"
              class="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              @click="handleResend"
              :disabled="isResending"
              class="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5"
            >
              <Loader2 v-if="isResending" class="w-3.5 h-3.5 animate-spin" />
              <span>Send Link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ShieldCheck, Mail, Eye, EyeOff, LogIn, Loader2, AlertCircle } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth.store';
import { authApi } from '../services/auth.api';

const router = useRouter();
const authStore = useAuthStore();

const email = ref<string>('');
const password = ref<string>('');
const showPassword = ref<boolean>(false);

const showResendModal = ref<boolean>(false);
const resendEmail = ref<string>('');
const isResending = ref<boolean>(false);
const resendStatusMessage = ref<string>('');

async function handleLogin() {
  const success = await authStore.loginAdmin({
    email: email.value.trim(),
    password: password.value,
  });

  if (success) {
    if (authStore.isSuperAdmin) {
      router.push('/super-admin');
    } else {
      router.push('/admin');
    }
  } else if (authStore.error && authStore.error.toLowerCase().includes('confirm your email')) {
    resendEmail.value = email.value.trim();
  }
}

async function handleResend() {
  if (!resendEmail.value.trim()) return;
  isResending.value = true;
  resendStatusMessage.value = '';
  try {
    const res = await authApi.resendVerification(resendEmail.value.trim());
    resendStatusMessage.value = res.message || 'Verification link resent to your email!';
  } catch (err: any) {
    resendStatusMessage.value = err.message || 'Failed to resend link.';
  } finally {
    isResending.value = false;
  }
}
</script>
